import { NextRequest, NextResponse } from "next/server";
import { dbAdmin, messagingAdmin, authAdmin } from "@/lib/firebaseAdmin";

// H2 fix: helper to verify the Firebase ID token from the Authorization header
async function verifyRequest(request: NextRequest): Promise<{ uid: string } | null> {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
        return null;
    }
    const idToken = authHeader.slice(7);
    try {
        const decoded = await authAdmin.verifyIdToken(idToken);
        return { uid: decoded.uid };
    } catch {
        return null;
    }
}

export async function POST(request: NextRequest) {
    // H2 fix: reject unauthenticated callers before doing anything else
    const caller = await verifyRequest(request);
    if (!caller) {
        return NextResponse.json(
            { error: "Unauthorized: valid Firebase ID token required" },
            { status: 401 }
        );
    }

    try {
        const body = await request.json();
        const { userId, title, body: messageBody, type, data, tokens } = body;

        // Validate required fields
        if (!userId || !title || !messageBody) {
            return NextResponse.json(
                { error: "Missing required fields: userId, title, body" },
                { status: 400 }
            );
        }

        // H2 fix: callers may only send notifications to themselves
        if (caller.uid !== userId) {
            return NextResponse.json(
                { error: "Forbidden: you may only send notifications to your own account" },
                { status: 403 }
            );
        }

        // If specific tokens are provided, use them; otherwise fetch from Firestore
        let fcmTokens = tokens;

        if (!fcmTokens || fcmTokens.length === 0) {
            const db = dbAdmin;
            const userDoc = await db.collection("users").doc(userId).get();

            if (!userDoc.exists) {
                return NextResponse.json(
                    { error: "User not found" },
                    { status: 404 }
                );
            }

            const userData = userDoc.data();
            fcmTokens = userData?.fcmTokens?.map((t: { token: string }) => t.token) || [];
        }

        if (fcmTokens.length === 0) {
            return NextResponse.json(
                { error: "No FCM tokens registered for this user" },
                { status: 400 }
            );
        }

        // Prepare notification payload
        const message = {
            notification: {
                title,
                body: messageBody,
                icon: "/icon.svg",
            },
            data: {
                type: type || "notification",
                ...data,
            },
            tokens: fcmTokens,
        };

        // Send multicast message
        const response = await messagingAdmin.sendEachForMulticast(message);

        // Handle failed tokens (remove invalid ones)
        if (response.failureCount > 0) {
            const failedTokens: string[] = [];
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    failedTokens.push(fcmTokens[idx]);
                }
            });

            if (failedTokens.length > 0) {
                const db = dbAdmin;
                const userRef = db.collection("users").doc(userId);
                const userDoc = await userRef.get();
                const userData = userDoc.data();

                if (userData?.fcmTokens) {
                    const updatedTokens = userData.fcmTokens.filter(
                        (t: { token: string }) => !failedTokens.includes(t.token)
                    );
                    await userRef.update({ fcmTokens: updatedTokens });
                }
            }
        }

        return NextResponse.json({
            success: true,
            successCount: response.successCount,
            failureCount: response.failureCount,
            results: response.responses.map((r, i) => ({
                token: fcmTokens[i],
                success: r.success,
                error: r.error?.message,
            })),
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to send notification";
        console.error("Error sending notification:", error);
        return NextResponse.json(
            { error: message },
            { status: 500 }
        );
    }
}
