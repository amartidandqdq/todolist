import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', 'data', 'todolist.db');
const dataDir = path.dirname(dbPath);

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const SQL = await initSqlJs();
const buffer = fs.existsSync(dbPath) ? fs.readFileSync(dbPath) : undefined;
const sqlDb = new SQL.Database(buffer);

// Auto-save to disk every 5s and on exit
let dirty = false;
function save() { if (dirty) { fs.writeFileSync(dbPath, sqlDb.export()); dirty = false; } }
setInterval(save, 5000);
process.on('exit', save);
process.on('SIGINT', () => { save(); process.exit(); });
process.on('SIGTERM', () => { save(); process.exit(); });

// Wrapper matching better-sqlite3 API so all routes work unchanged
const db = {
  prepare(sql: string) {
    return {
      all(...params: any[]) {
        const stmt = sqlDb.prepare(sql);
        stmt.bind(params.length === 1 && Array.isArray(params[0]) ? params[0] : params);
        const rows: any[] = [];
        while (stmt.step()) rows.push(stmt.getAsObject());
        stmt.free();
        return rows;
      },
      get(...params: any[]) {
        const stmt = sqlDb.prepare(sql);
        stmt.bind(params.length === 1 && Array.isArray(params[0]) ? params[0] : params);
        const row = stmt.step() ? stmt.getAsObject() : undefined;
        stmt.free();
        return row;
      },
      run(...params: any[]) {
        sqlDb.run(sql, params.length === 1 && Array.isArray(params[0]) ? params[0] : params);
        dirty = true;
        return {
          changes: sqlDb.getRowsModified(),
          lastInsertRowid: (sqlDb.exec("SELECT last_insert_rowid() as id")[0]?.values[0]?.[0]) ?? 0,
        };
      },
    };
  },
  exec(sql: string) {
    sqlDb.run(sql);
    dirty = true;
  },
  pragma(_p: string) {},
  transaction<T>(fn: () => T) {
    return () => {
      sqlDb.run('BEGIN');
      try { const result = fn(); sqlDb.run('COMMIT'); dirty = true; return result; }
      catch (e) { sqlDb.run('ROLLBACK'); throw e; }
    };
  },
};

// Schema
db.exec(`
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
`);

// Migration: add starred column
try { db.exec('ALTER TABLE tasks ADD COLUMN starred INTEGER DEFAULT 0'); } catch (_) {}
// Migration: add due_time column
try { db.exec('ALTER TABLE tasks ADD COLUMN due_time TEXT'); } catch (_) {}

// Seed default list
const existing = db.prepare('SELECT id FROM lists WHERE id = 1').get();
if (!existing) db.prepare('INSERT INTO lists (id, name, color, position) VALUES (?, ?, ?, ?)').run(1, 'My Tasks', '#4285f4', 0);

save();

export default db;
