import { NextRequest, NextResponse } from "next/server";
import { dbAdmin, messagingAdmin } from "@/lib/firebaseAdmin";

export async function POST(request: NextRequest) {
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

        // If specific tokens are provided, use them; otherwise fetch from Firestore
        let fcmTokens = tokens;

        if (!fcmTokens || fcmTokens.length === 0) {
            // Fetch user's FCM tokens from Firestore
            const db = dbAdmin;
            const userDoc = await db.collection("users").doc(userId).get();

            if (!userDoc.exists) {
                return NextResponse.json(
                    { error: "User not found" },
                    { status: 404 }
                );
            }

            const userData = userDoc.data();
            fcmTokens = userData?.fcmTokens?.map((t: any) => t.token) || [];
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

            // Remove failed tokens from Firestore
            if (failedTokens.length > 0) {
                const db = dbAdmin;
                const userRef = db.collection("users").doc(userId);
                const userDoc = await userRef.get();
                const userData = userDoc.data();

                if (userData?.fcmTokens) {
                    const updatedTokens = userData.fcmTokens.filter(
                        (t: any) => !failedTokens.includes(t.token)
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
    } catch (error: any) {
        console.error("Error sending notification:", error);
        return NextResponse.json(
            { error: error.message || "Failed to send notification" },
            { status: 500 }
        );
    }
}
