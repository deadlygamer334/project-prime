import { NextRequest, NextResponse } from "next/server";
import { dbAdmin } from "@/lib/firebaseAdmin";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, token } = body;

        // Validate required fields
        if (!userId || !token) {
            return NextResponse.json(
                { error: "Missing required fields: userId, token" },
                { status: 400 }
            );
        }

        const db = dbAdmin;
        const userRef = db.collection("users").doc(userId);

        // Get user document
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        const userData = userDoc.data();
        const existingTokens = userData?.fcmTokens || [];

        // Remove the token
        const updatedTokens = existingTokens.filter((t: any) => t.token !== token);

        await userRef.update({
            fcmTokens: updatedTokens,
        });

        return NextResponse.json({
            success: true,
            message: "Token unregistered successfully",
        });
    } catch (error: any) {
        console.error("Error unregistering token:", error);
        return NextResponse.json(
            { error: error.message || "Failed to unregister token" },
            { status: 500 }
        );
    }
}
