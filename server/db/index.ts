/**
 * @module db
 * Database singleton — initializes sql.js wrapper, applies schema, exports adapter.
 *
 * Usage: `import db from './db/index.js'`
 *
 * The adapter implements a better-sqlite3-compatible API surface.
 */
export type { DatabaseAdapter, PreparedStatement, RunResult } from './types.js';
export { createDatabase, forceSave } from './wrapper.js';
export { applySchema } from './schema.js';

import path from 'path';
import { fileURLToPath } from 'url';
import { createDatabase } from './wrapper.js';
import { applySchema } from './schema.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', '..', 'data', 'todolist.db');

const db = await createDatabase(dbPath);
applySchema(db);

export default db;
