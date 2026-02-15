import { NextResponse } from 'next/server';
import { authAdmin } from '@/lib/firebaseAdmin';

export async function POST() {
    // Only allow in development
    if (process.env.NODE_ENV !== 'development') {
        return NextResponse.json({ error: 'Not allowed in production' }, { status: 403 });
    }

    try {
        const TEST_EMAIL = 'test@prime.local';

        // Find user by email
        const userRecord = await authAdmin.getUserByEmail(TEST_EMAIL);

        // Create custom token
        const customToken = await authAdmin.createCustomToken(userRecord.uid);

        return NextResponse.json({ token: customToken });
    } catch (error: any) {
        console.error('Error generating dev token:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
