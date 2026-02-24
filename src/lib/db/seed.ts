import { db } from './index';
import { quotes, reels } from './schema';
import fs from 'fs';
import path from 'path';
import { count } from 'drizzle-orm';

export async function seedDatabase() {
    try {
        // Ensure tables exist
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

        // Check if quotes table is empty or needs sync
        const quotesCount = await db.select({ value: count() }).from(quotes);
        const quotesPath = path.join(process.cwd(), 'backend', 'data', 'quotes.json');

        if (fs.existsSync(quotesPath)) {
            const quotesData = JSON.parse(fs.readFileSync(quotesPath, 'utf8'));

            // Re-seed if count is different (indicates update) or table is empty
            if (quotesCount[0].value !== quotesData.length) {
                console.log('Syncing quotes database with JSON file...');
                // Clear existing quotes for a clean re-seed
                await (db as any).$client.execute('DELETE FROM quotes');

                const formattedQuotes = quotesData.map((q: string) => {
                    // Parse "Quote — Author" format (our new emojis-free format)
                    const match = q.match(/^(.*)\s*—\s*(.*)$/);
                    if (match) {
                        const content = match[1].trim();
                        const author = match[2].trim();
                        // No need for emojiMatch as we removed them, but handle gently
                        return {
                            text: content.replace(/\.+$/, ''),
                            author: author,
                            emoji: null
                        };
                    }
                    return { text: q, author: 'Unknown', emoji: null };
                });

                if (formattedQuotes.length > 0) {
                    await db.insert(quotes).values(formattedQuotes);
                    console.log(`Seeded ${formattedQuotes.length} quotes`);
                }
            }
        }

        // Check if reels table is empty
        const reelsCount = await db.select({ value: count() }).from(reels);
        if (reelsCount[0].value === 0) {
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
    }
}
