import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/firebase";
import admin from "firebase-admin";

// Initialize Firebase Admin SDK (if not already initialized)
if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            }),
        });
    } catch (error) {
        console.error("Firebase admin initialization error:", error);
    }
}

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

        const db = admin.firestore();
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
