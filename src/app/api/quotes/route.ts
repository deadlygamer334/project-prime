import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { quotes } from '@/lib/db/schema';
import { seedDatabase } from '@/lib/db/seed';

export async function GET() {
    try {
        // Ensure tables exist and are seeded (simplified for local SQLite)
        // In a real app we'd use migrations, but for this "portable" request
        // we'll try to seed if empty
        await seedDatabase();

        const allQuotes = await db.select().from(quotes);
        // Format back to "Emoji Text — Author" for the frontend if needed,
        // or just return the objects. The current frontend expects string[]
        const formattedQuotes = allQuotes.map(q => `${q.emoji || ''} ${q.text} — ${q.author}`);

        return NextResponse.json(formattedQuotes);
    } catch (error) {
        console.error('Error fetching quotes from SQLite:', error);
        return NextResponse.json({ error: 'Failed to load quotes' }, { status: 500 });
    }
}
