import { NextResponse } from "next/server";
import { dbAdmin } from "@/lib/firebaseAdmin";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get("uid");

    if (!uid) {
        return NextResponse.json({ error: "Missing UID" }, { status: 400 });
    }

    try {
        const db = dbAdmin;

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
