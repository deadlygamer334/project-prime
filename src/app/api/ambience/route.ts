import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
    try {
        const filePath = path.join(process.cwd(), 'backend', 'data', 'ambience.json');
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const ambience = JSON.parse(fileContent);
        return NextResponse.json(ambience);
    } catch (error) {
        console.error('Error reading ambience.json:', error);
        return NextResponse.json({ error: 'Failed to load ambience data' }, { status: 500 });
    }
}
