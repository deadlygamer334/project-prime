const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

function getEnvVar(name) {
    const regex = new RegExp(`^${name}=(.*)$`, 'm');
    const match = envContent.match(regex);
    if (match) {
        let value = match[1].trim();
        if (value.startsWith('"') && value.endsWith('"')) {
            value = value.substring(1, value.length - 1);
        }
        return value;
    }
    return null;
}

const projectId = getEnvVar('NEXT_PUBLIC_FIREBASE_PROJECT_ID');
const clientEmail = getEnvVar('FIREBASE_CLIENT_EMAIL');
let privateKey = getEnvVar('FIREBASE_PRIVATE_KEY');

if (privateKey) {
    privateKey = privateKey.replace(/\\n/g, '\n');
}

admin.initializeApp({
    credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
    }),
});

const auth = admin.auth();
const db = admin.firestore();

const TEST_EMAIL = 'test@prime.local';
const TEST_PASSWORD = 'password123';
const DISPLAY_NAME = 'Test User';

async function createTestUser() {
    try {
        console.log(`Checking if user ${TEST_EMAIL} exists...`);
        let userRecord;
        try {
            userRecord = await auth.getUserByEmail(TEST_EMAIL);
            console.log('User already exists. Updating password...');
            await auth.updateUser(userRecord.uid, {
                password: TEST_PASSWORD,
                displayName: DISPLAY_NAME
            });
        } catch (error) {
            if (error.code === 'auth/user-not-found') {
                console.log('Creating new user...');
                userRecord = await auth.createUser({
                    email: TEST_EMAIL,
                    password: TEST_PASSWORD,
                    displayName: DISPLAY_NAME,
                });
            } else {
                throw error;
            }
        }

        console.log(`User created/updated: ${userRecord.uid}`);

        // Initialize Firestore document
        const userRef = db.collection('users').doc(userRecord.uid);
        await userRef.set({
            displayName: DISPLAY_NAME,
            email: TEST_EMAIL,
            leaderboardPublic: true,
            createdAt: new Date().toISOString(),
            lastSeen: new Date().toISOString(),
            settings: {
                userName: DISPLAY_NAME,
                leaderboardPublic: true,
                themeMode: 'dark',
                themeVibe: 'midnight'
            }
        }, { merge: true });

        console.log('Firestore document initialized.');
        console.log('-----------------------------------');
        console.log('CREDENTIALS:');
        console.log(`Email: ${TEST_EMAIL}`);
        console.log(`Password: ${TEST_PASSWORD}`);
        console.log('-----------------------------------');

    } catch (e) {
        console.error('Error:', e);
    } finally {
        process.exit();
    }
}

createTestUser();
