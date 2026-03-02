import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { quotes } from '@/lib/db/schema';
import { seedDatabase } from '@/lib/db/seed';

// Module-level singleton: only seed once per serverless function instance.
// Previously, seedDatabase() ran on every GET, adding a DB read to every request's TTFB.
let isSeeded = false;

export async function GET() {
    try {
        if (!isSeeded) {
            await seedDatabase();
            isSeeded = true;
        }

        const allQuotes = await db.select().from(quotes);
        const formattedQuotes = allQuotes.map(q => `${q.emoji || ''} ${q.text} — ${q.author}`);

        return NextResponse.json(formattedQuotes, {
            headers: {
                // Edge cache: serve stale for up to 24hr while revalidating in background
                'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
            }
        });
    } catch (error) {
        console.error('Error fetching quotes from SQLite:', error);
        return NextResponse.json({ error: 'Failed to load quotes' }, { status: 500 });
    }
}

