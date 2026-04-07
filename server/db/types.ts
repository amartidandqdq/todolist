/** Result from a SQL run() operation */
export interface RunResult {
  /** Number of rows affected */
  changes: number;
  /** ID of last inserted row */
  lastInsertRowid: number | bigint;
}

/** Prepared statement with better-sqlite3-compatible API */
export interface PreparedStatement {
  /** Execute query and return all matching rows */
  all(...params: any[]): Record<string, any>[];
  /** Execute query and return first matching row */
  get(...params: any[]): Record<string, any> | undefined;
  /** Execute a write query (INSERT/UPDATE/DELETE) */
  run(...params: any[]): RunResult;
}

/** Database adapter interface — decoupled from sql.js implementation */
export interface DatabaseAdapter {
  /** Prepare a SQL statement for execution */
  prepare(sql: string): PreparedStatement;
  /** Execute raw SQL (DDL, multi-statement) */
  exec(sql: string): void;
  /** No-op for sql.js compatibility with better-sqlite3 */
  pragma(p: string): void;
  /** Wrap a function in a BEGIN/COMMIT transaction */
  transaction<T>(fn: () => T): () => T;
}
