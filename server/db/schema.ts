import type { DatabaseAdapter } from './types.js';

/** Core table definitions */
const TABLES = `
  CREATE TABLE IF NOT EXISTS lists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#4285f4',
    position INTEGER NOT NULL DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    list_id INTEGER NOT NULL,
    parent_id INTEGER,
    title TEXT NOT NULL,
    notes TEXT DEFAULT '',
    due_date TEXT,
    completed INTEGER DEFAULT 0,
    completed_at TEXT,
    position INTEGER NOT NULL DEFAULT 0,
    recurrence_rule TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES tasks(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS webhooks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT NOT NULL,
    events TEXT NOT NULL,
    secret TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_tasks_list_id ON tasks(list_id);
  CREATE INDEX IF NOT EXISTS idx_tasks_parent_id ON tasks(parent_id);
  CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(list_id, completed, position);
`;

/**
 * Apply schema and migrations to the database.
 * Safe to call multiple times (all operations are idempotent).
 * @param db - Database adapter to apply schema to
 */
export function applySchema(db: DatabaseAdapter): void {
  db.exec(TABLES);

  // Migrations (idempotent ALTER TABLE — catch duplicate column errors)
  try { db.exec('ALTER TABLE tasks ADD COLUMN starred INTEGER DEFAULT 0'); } catch (_) {}
  try { db.exec('ALTER TABLE tasks ADD COLUMN due_time TEXT'); } catch (_) {}

  // Seed default list
  const existing = db.prepare('SELECT id FROM lists WHERE id = 1').get();
  if (!existing) {
    db.prepare('INSERT INTO lists (id, name, color, position) VALUES (?, ?, ?, ?)').run(1, 'My Tasks', '#4285f4', 0);
  }
}
