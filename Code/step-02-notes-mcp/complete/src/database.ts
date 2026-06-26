import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Use the same database as step-01-notes-app
const DB_PATH = path.join(__dirname, '..', '..', '..', 'step-01-notes-app', 'data', 'notes.db');

export interface Note {
  id: number;
  content: string;
  tags: string | null;
  created_at: string;
  updated_at: string;
}

export function initDatabase(): DatabaseSync {
  const db = new DatabaseSync(DB_PATH);

  db.exec(`
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content TEXT NOT NULL,
      tags TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create indexes for search performance
  db.exec(`CREATE INDEX IF NOT EXISTS idx_notes_content ON notes(content)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_notes_tags ON notes(tags)`);

  return db;
}

export function addNote(db: DatabaseSync, content: string, tags?: string[]): Note {
  const tagsString = tags && tags.length > 0 ? tags.join(',') : null;

  const stmt = db.prepare(`
    INSERT INTO notes (content, tags)
    VALUES (?, ?)
  `);

  const result = stmt.run(content, tagsString);

  const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(result.lastInsertRowid) as unknown as Note;
  return note;
}

export function searchNotes(db: DatabaseSync, query: string): Note[] {
  // NOTE: This only searches the note content, not tags.
  // Want to also match tags? Add `OR tags LIKE ?` to the WHERE clause
  // and pass the query a second time, e.g.:
  //   WHERE content LIKE ? OR tags LIKE ?
  //   return stmt.all(`%${query}%`, `%${query}%`) as unknown as Note[];
  const stmt = db.prepare(`
    SELECT * FROM notes
    WHERE content LIKE ?
    ORDER BY updated_at DESC
  `);

  return stmt.all(`%${query}%`) as unknown as Note[];
}

export function listNotes(db: DatabaseSync, limit: number = 10): Note[] {
  const stmt = db.prepare(`
    SELECT * FROM notes
    ORDER BY updated_at DESC
    LIMIT ?
  `);

  return stmt.all(limit) as unknown as Note[];
}

export function updateNote(
  db: DatabaseSync,
  id: number,
  updates: { content?: string; tags?: string[] }
): Note | null {
  const existing = db.prepare('SELECT * FROM notes WHERE id = ?').get(id) as unknown as Note | undefined;
  if (!existing) {
    return null;
  }

  const content = updates.content ?? existing.content;

  let tagsString = existing.tags;
  if (updates.tags !== undefined) {
    tagsString = updates.tags.length > 0 ? updates.tags.join(',') : null;
  }

  const stmt = db.prepare(`
    UPDATE notes SET content = ?, tags = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `);
  stmt.run(content, tagsString, id);

  return db.prepare('SELECT * FROM notes WHERE id = ?').get(id) as unknown as Note;
}

export function deleteNote(db: DatabaseSync, id: number): boolean {
  const stmt = db.prepare('DELETE FROM notes WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}

export function getNotesByTag(db: DatabaseSync, tag: string): Note[] {
  const stmt = db.prepare(`
    SELECT * FROM notes
    WHERE (',' || tags || ',') LIKE '%,' || ? || ',%'
    ORDER BY updated_at DESC
  `);

  // Exact, comma-delimited match: wrapping both sides in commas means the tag
  // "work" matches "work,demo" but NOT "workshop".
  return stmt.all(tag) as unknown as Note[];
}

export function getAllNotes(db: DatabaseSync): Note[] {
  const stmt = db.prepare(`
    SELECT * FROM notes
    ORDER BY updated_at DESC
  `);

  return stmt.all() as unknown as Note[];
}

export function getRecentNotes(db: DatabaseSync, count: number = 5): Note[] {
  const stmt = db.prepare(`
    SELECT * FROM notes
    ORDER BY created_at DESC
    LIMIT ?
  `);

  return stmt.all(count) as unknown as Note[];
}
