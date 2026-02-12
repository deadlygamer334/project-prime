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

        // Check if quotes table is empty
        const quotesCount = await db.select({ value: count() }).from(quotes);
        if (quotesCount[0].value === 0) {
            const quotesPath = path.join(process.cwd(), 'backend', 'data', 'quotes.json');
            if (fs.existsSync(quotesPath)) {
                const quotesData = JSON.parse(fs.readFileSync(quotesPath, 'utf8'));
                const formattedQuotes = quotesData.map((q: string) => {
                    // Parse "Emoji Text - Author" format
                    const match = q.match(/^(.*)\s*—\s*(.*)$/);
                    if (match) {
                        const contentWithEmoji = match[1].trim();
                        const author = match[2].trim();
                        const emojiMatch = contentWithEmoji.match(/^(\ud83c[\udf00-\uffff]|\ud83d[\udc00-\ude4f\ude80-\udeff]|[\u2600-\u26FF\u2700-\u27BF])\s*(.*)$/);
                        return {
                            text: (emojiMatch ? emojiMatch[2] : contentWithEmoji).replace(/\.+$/, ''),
                            author: author,
                            emoji: emojiMatch ? emojiMatch[1] : null
                        };
                    }
                    return { text: q, author: 'Unknown', emoji: null };
                });

                if (formattedQuotes.length > 0) {
                    await db.insert(quotes).values(formattedQuotes);
                    console.log('Seeded quotes table');
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
