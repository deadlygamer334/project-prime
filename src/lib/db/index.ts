import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';
import path from 'path';

const dbPath = path.join(process.cwd(), 'backend', 'data', 'database.sqlite');
const url = `file:${dbPath}`;

const client = createClient({ url });

export const db = drizzle(client, { schema });
