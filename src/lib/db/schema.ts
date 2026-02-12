import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const quotes = sqliteTable('quotes', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    text: text('text').notNull(),
    author: text('author'),
    emoji: text('emoji'),
});

export const reels = sqliteTable('reels', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    url: text('url').notNull(),
});
