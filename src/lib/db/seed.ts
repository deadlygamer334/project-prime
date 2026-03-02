import { db } from './index';
import { quotes, reels } from './schema';
import fs from 'fs';
import path from 'path';
import { count } from 'drizzle-orm';

let initialSetupDone = false;
let isSeeding = false; // Prevent concurrent seeding

export async function seedDatabase() {
    if (isSeeding) return;

    try {
        isSeeding = true;

        // Ensure tables exist and run migrations ONLY ONCE per server instance
        if (!initialSetupDone) {
            await (db as any).$client.execute(`
                CREATE TABLE IF NOT EXISTS quotes (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    text TEXT NOT NULL,
                    author TEXT,
                    emoji TEXT
                )
            `);
            await (db as any).$client.execute(`
                CREATE TABLE IF NOT EXISTS reels (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    url TEXT NOT NULL
                )
            `);

            // Clean up existing quotes (remove trailing periods as requested)
            await (db as any).$client.execute(`
                UPDATE quotes SET text = RTRIM(text, '.')
            `);
            initialSetupDone = true;
        }

        const quotesPath = path.join(process.cwd(), 'backend', 'data', 'quotes.json');
        if (fs.existsSync(quotesPath)) {
            const quotesData = JSON.parse(fs.readFileSync(quotesPath, 'utf8'));

            // Check if quotes table count matches JSON count
            const quotesCountResult = await db.select({ value: count() }).from(quotes);
            const quotesCount = quotesCountResult[0].value;

            // Re-seed if count is different (indicates update)
            if (quotesCount !== quotesData.length) {
                console.log(`Syncing quotes database: DB (${quotesCount}) vs JSON (${quotesData.length})...`);

                // Clear existing quotes for a clean re-seed
                await (db as any).$client.execute('DELETE FROM quotes');

                const formattedQuotes = quotesData.map((q: string) => {
                    const match = q.match(/^(.*)\s*—\s*(.*)$/);
                    if (match) {
                        return {
                            text: match[1].trim().replace(/\.+$/, ''),
                            author: match[2].trim(),
                            emoji: null
                        };
                    }
                    return { text: q, author: 'Unknown', emoji: null };
                });

                if (formattedQuotes.length > 0) {
                    await db.insert(quotes).values(formattedQuotes);
                    console.log(`Successfully synced ${formattedQuotes.length} quotes`);
                }
            }
        }

        // Check if reels table is empty
        const reelsCountResult = await db.select({ value: count() }).from(reels);
        if (reelsCountResult[0].value === 0) {
            const reelsPath = path.join(process.cwd(), 'backend', 'data', 'reels.json');
            if (fs.existsSync(reelsPath)) {
                const reelsData = JSON.parse(fs.readFileSync(reelsPath, 'utf8'));
                const formattedReels = reelsData.map((url: string) => ({ url }));
                if (formattedReels.length > 0) {
                    await db.insert(reels).values(formattedReels);
                    console.log('Seeded reels table');
                }
            }
        }
    } catch (error) {
        console.error('Migration/Seeding failed:', error);
    } finally {
        isSeeding = false;
    }
}
