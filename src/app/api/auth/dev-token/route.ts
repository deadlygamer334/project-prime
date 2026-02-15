import { NextResponse } from 'next/server';
import { authAdmin } from '@/lib/firebaseAdmin';

export async function POST() {
    // Only allow in development
    if (process.env.NODE_ENV !== 'development') {
        return NextResponse.json({ error: 'Not allowed in production' }, { status: 403 });
    }

    try {
        const TEST_EMAIL = 'test@prime.local';

        // Find or Create user
        let userRecord;
        try {
            userRecord = await authAdmin.getUserByEmail(TEST_EMAIL);
        } catch (error: any) {
            if (error.code === 'auth/user-not-found') {
                console.log(`🔨 Creating dev test user: ${TEST_EMAIL}`);
                userRecord = await authAdmin.createUser({
                    email: TEST_EMAIL,
                    emailVerified: true,
                    displayName: 'Prime Dev Explorer',
                    photoURL: 'https://api.dicebear.com/7.x/bottts/svg?seed=Prime',
                });
            } else {
                throw error;
            }
        }

        // Create custom token
        const customToken = await authAdmin.createCustomToken(userRecord.uid);

        return NextResponse.json({ token: customToken });
    } catch (error: any) {
        console.error('Error generating dev token:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
