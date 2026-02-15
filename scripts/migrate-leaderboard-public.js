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

async function migrate() {
    try {
        const usersRef = db.collection('users');
        const snapshot = await usersRef.get();

        console.log(`Starting migration for ${snapshot.size} users...`);
        const batch = db.batch();
        let changed = 0;

        snapshot.docs.forEach(docSnap => {
            const data = docSnap.data();
            const userRef = usersRef.doc(docSnap.id);

            // Default to true if not present anywhere, otherwise use existing setting
            let isPublic = true;
            if (data.settings && typeof data.settings.leaderboardPublic === 'boolean') {
                isPublic = data.settings.leaderboardPublic;
            } else if (typeof data.leaderboardPublic === 'boolean') {
                isPublic = data.leaderboardPublic;
            }

            // Always set it at the root
            batch.set(userRef, { leaderboardPublic: isPublic }, { merge: true });
            changed++;
        });

        if (changed > 0) {
            await batch.commit();
            console.log(`Successfully migrated ${changed} users.`);
        } else {
            console.log('No users to migrate.');
        }

    } catch (e) {
        console.error('Migration failed:', e);
    } finally {
        process.exit();
    }
}

migrate();
