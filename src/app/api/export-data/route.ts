import { NextResponse } from "next/server";
import * as admin from "firebase-admin";

// Helper to ensure Admin SDK is initialized
function getFirebaseAdmin() {
    if (!admin.apps.length) {
        try {
            let credential;

            // Try environment variables first
            if (process.env.FIREBASE_PRIVATE_KEY) {
                credential = admin.credential.cert({
                    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
                });
            } else {
                // Fallback to local serviceAccountKey.json
                try {
                    // eslint-disable-next-line @typescript-eslint/no-require-imports
                    const serviceAccount = require("../../../../serviceAccountKey.json");
                    credential = admin.credential.cert(serviceAccount);
                } catch (e) {
                    console.warn("No serviceAccountKey.json found and env vars missing.");
                }
            }

            if (credential) {
                admin.initializeApp({
                    credential,
                });
            }
        } catch (error) {
            console.error('Firebase Admin initialization error', error);
            return null;
        }
    }
    return admin;
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get("uid");

    if (!uid) {
        return NextResponse.json({ error: "Missing UID" }, { status: 400 });
    }

    try {
        const adminInstance = getFirebaseAdmin();
        if (!adminInstance || !adminInstance.apps.length) {
            return NextResponse.json({
                error: "Server Configuration Error",
                details: "Firebase Admin SDK could not be initialized. Check credentials."
            }, { status: 500 });
        }

        // unexpected error: default Firebase app does not exist - this happens if we call firestore() before app is ready
        const db = adminInstance.firestore();

        const userDoc = await db.collection("users").doc(uid).get();
        if (!userDoc.exists) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const userData: any = userDoc.data();

        // Fetch Subcollections
        const collections = ["habits", "todoLists", "focusSessions"];
        const exportData: any = { user: userData };

        for (const colName of collections) {
            const snapshot = await db.collection("users").doc(uid).collection(colName).get();
            exportData[colName] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }

        // Return as a downloadable JSON file
        const json = JSON.stringify(exportData, null, 2);

        return new NextResponse(json, {
            headers: {
                "Content-Type": "application/json",
                "Content-Disposition": `attachment; filename="data-${uid}.json"`,
            },
        });

    } catch (error: any) {
        console.error("Export failed:", error);
        return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
    }
}
