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

const db = admin.firestore();

async function run() {
    try {
        const snapshot = await db.collection('users')
            .where('weeklyFocusMinutes', '>', 0)
            .orderBy('weeklyFocusMinutes', 'desc')
            .get();

        const results = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        console.log('JSON_START');
        console.log(JSON.stringify(results, null, 2));
        console.log('JSON_END');

    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}

run();
