const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// --- Configuration ---
const DATA_FILE = path.join(__dirname, '../data.json');
const SERVICE_ACCOUNT_KEY = path.join(__dirname, '../serviceAccountKey.json');
const BATCH_SIZE = 500;

// --- Initialization ---
if (!fs.existsSync(SERVICE_ACCOUNT_KEY)) {
    console.error('ERROR: serviceAccountKey.json not found in the root directory.');
    console.error('Please download it from Firebase Console > Project Settings > Service Accounts and place it in the project root.');
    process.exit(1);
}

const serviceAccount = require(SERVICE_ACCOUNT_KEY);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// --- Main Migration Function ---
async function migrateData() {
    if (!fs.existsSync(DATA_FILE)) {
        console.error(`ERROR: Data file not found at ${DATA_FILE}`);
        process.exit(1);
    }

    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    console.log('Starting migration...');
    const startTime = Date.now();

    let totalOps = 0;
    let batch = db.batch();
    let batchCount = 0;

    // Helper to commit batch if full
    async function checkBatch() {
        if (batchCount >= BATCH_SIZE) {
            await batch.commit();
            console.log(`Committed batch of ${batchCount} operations.`);
            batch = db.batch();
            batchCount = 0;
        }
    }

    try {
        // 1. Migrate Users
        if (data.users) {
            console.log(`Migrating ${data.users.length} users...`);
            for (const user of data.users) {
                const userRef = db.collection('users').doc(user.userId);
                batch.set(userRef, {
                    ...user,
                    createdAt: user.createdAt ? new Date(user.createdAt) : admin.firestore.FieldValue.serverTimestamp()
                });
                batchCount++;
                totalOps++;
                await checkBatch();
            }
        }

        // 2. Migrate Habits
        if (data.habits) {
            console.log(`Migrating ${data.habits.length} habits...`);
            for (const habit of data.habits) {
                const habitRef = db.collection('users').doc(habit.userId).collection('habits').doc(habit.habitId);

                // Transform history map if needed, or keep as map
                // Ensure createdAt is a Date object
                const habitData = {
                    ...habit,
                    createdAt: habit.createdAt ? new Date(habit.createdAt) : admin.firestore.FieldValue.serverTimestamp()
                };
                delete habitData.userId; // Don't need userId inside the doc if it's in the path

                batch.set(habitRef, habitData);
                batchCount++;
                totalOps++;
                await checkBatch();
            }
        }

        // 3. Migrate Todo Lists
        if (data.todoLists) {
            console.log(`Migrating ${data.todoLists.length} todo lists...`);
            for (const list of data.todoLists) {
                // Use date as ID or random ID? Using random auto-id for flexibility, but date queryable
                const listRef = db.collection('users').doc(list.userId).collection('todoLists').doc();

                const listData = {
                    date: list.date, // Keep string YYYY-MM-DD for simple date matching
                    tasks: list.tasks,
                    createdAt: admin.firestore.FieldValue.serverTimestamp()
                };

                batch.set(listRef, listData);
                batchCount++;
                totalOps++;
                await checkBatch();
            }
        }

        // 4. Migrate Focus Sessions
        if (data.focusSessions) {
            console.log(`Migrating ${data.focusSessions.length} focus sessions...`);
            for (const session of data.focusSessions) {
                const sessionRef = db.collection('users').doc(session.userId).collection('focusSessions').doc();

                const sessionData = {
                    ...session,
                    startTime: new Date(session.startTime) // Convert ISO string to Firestore Timestamp
                };
                delete sessionData.userId;

                batch.set(sessionRef, sessionData);
                batchCount++;
                totalOps++;
                await checkBatch();
            }
        }

        // Commit final batch
        if (batchCount > 0) {
            await batch.commit();
            console.log(`Committed final batch of ${batchCount} operations.`);
        }

        const duration = (Date.now() - startTime) / 1000;
        console.log('--------------------------------------------------');
        console.log(`Migration completed successfully in ${duration}s.`);
        console.log(`Total documents written: ${totalOps}`);

    } catch (error) {
        console.error('Migration failed:', error);
    }
}

migrateData();
