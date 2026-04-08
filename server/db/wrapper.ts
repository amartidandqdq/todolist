import initSqlJs from 'sql.js';
import fs from 'fs';
import type { DatabaseAdapter } from './types.js';
import { config } from '../config/index.js';

/** Save callback ref */
let dirty = false;

/**
 * Create a DatabaseAdapter wrapping sql.js with better-sqlite3-compatible API.
 * @param dbPath - Absolute path to the SQLite file on disk
 * @returns DatabaseAdapter instance
 */
export async function createDatabase(dbPath: string): Promise<DatabaseAdapter> {
  const dataDir = dbPath.substring(0, dbPath.lastIndexOf('/') === -1 ? dbPath.lastIndexOf('\\') : dbPath.lastIndexOf('/'));
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  const SQL = await initSqlJs();
  const buffer = fs.existsSync(dbPath) ? fs.readFileSync(dbPath) : undefined;
  const sqlDb = new SQL.Database(buffer);

  /** Flush dirty data to disk */
  function save(): void {
    if (dirty) { fs.writeFileSync(dbPath, sqlDb.export()); dirty = false; }
  }

  setInterval(save, config.dbSaveInterval);
  process.on('exit', save);
  process.on('SIGINT', () => { save(); process.exit(); });
  process.on('SIGTERM', () => { save(); process.exit(); });

  /** Normalize params: unwrap single-array args */
  function norm(params: any[]): any[] {
    return params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
  }

  const db: DatabaseAdapter = {
    prepare(sql: string) {
      return {
        all(...params: any[]) {
          const stmt = sqlDb.prepare(sql);
          stmt.bind(norm(params));
          const rows: any[] = [];
          while (stmt.step()) rows.push(stmt.getAsObject());
          stmt.free();
          return rows;
        },
        get(...params: any[]) {
          const stmt = sqlDb.prepare(sql);
          stmt.bind(norm(params));
          const row = stmt.step() ? stmt.getAsObject() : undefined;
          stmt.free();
          return row;
        },
        run(...params: any[]) {
          sqlDb.run(sql, norm(params));
          dirty = true;
          return {
            changes: sqlDb.getRowsModified(),
            lastInsertRowid: (sqlDb.exec("SELECT last_insert_rowid() as id")[0]?.values[0]?.[0]) ?? 0,
          };
        },
      };
    },
    exec(sql: string) { sqlDb.run(sql); dirty = true; },
    pragma() {},
    transaction<T>(fn: () => T) {
      return () => {
        sqlDb.run('BEGIN');
        try { const r = fn(); sqlDb.run('COMMIT'); dirty = true; return r; }
        catch (e) { sqlDb.run('ROLLBACK'); throw e; }
      };
    },
  };

  return db;
}

/** Force a save — call on export/shutdown */
export function forceSave(): void { dirty = true; }
