import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { reels } from '@/lib/db/schema';
import { seedDatabase } from '@/lib/db/seed';

export async function GET() {
    try {
        await seedDatabase();

        const allReels = await db.select().from(reels);
        const reelUrls = allReels.map(r => r.url);

        return NextResponse.json(reelUrls);
    } catch (error) {
        console.error('Error fetching reels from SQLite:', error);
        return NextResponse.json({ error: 'Failed to load reels' }, { status: 500 });
    }
}
