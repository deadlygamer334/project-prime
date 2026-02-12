import { NextRequest, NextResponse } from "next/server";
import { dbAdmin } from "@/lib/firebaseAdmin";
import admin from "firebase-admin"; // Still needed for FieldValue

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, token, deviceType, browser } = body;

        // Validate required fields
        if (!userId || !token) {
            return NextResponse.json(
                { error: "Missing required fields: userId, token" },
                { status: 400 }
            );
        }

        const db = dbAdmin;
        const userRef = db.collection("users").doc(userId);

        // Check if token already exists
        const userDoc = await userRef.get();
        const userData = userDoc.data();
        const existingTokens = userData?.fcmTokens || [];

        // Check if this exact token already exists
        const tokenExists = existingTokens.some((t: any) => t.token === token);

        if (tokenExists) {
            return NextResponse.json({
                success: true,
                message: "Token already registered",
            });
        }

        // Add new token
        const tokenData = {
            token,
            deviceType: deviceType || "desktop",
            browser: browser || "unknown",
            timestamp: Date.now(),
        };

        await userRef.update({
            fcmTokens: admin.firestore.FieldValue.arrayUnion(tokenData),
        });

        return NextResponse.json({
            success: true,
            message: "Token registered successfully",
        });
    } catch (error: any) {
        console.error("Error registering token:", error);
        return NextResponse.json(
            { error: error.message || "Failed to register token" },
            { status: 500 }
        );
    }
}
