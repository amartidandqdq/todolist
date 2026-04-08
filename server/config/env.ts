/**
 * @module config/env
 * Centralized, validated configuration from environment variables.
 * All hardcoded values are extracted here. Fail-fast on invalid config.
 */

function envInt(key: string, fallback: number): number {
  const v = process.env[key];
  if (!v) return fallback;
  const n = parseInt(v, 10);
  if (isNaN(n)) throw new Error(`Config error: ${key}="${v}" is not a valid integer`);
  return n;
}

function envStr(key: string, fallback: string): string {
  return process.env[key] || fallback;
}

/**
 * Application configuration. All values are frozen (immutable at runtime).
 * Override via environment variables (see .env.example).
 */
export const config = Object.freeze({
  /** Server port */
  port: envInt('PORT', 3000),
  /** Path to SQLite data directory */
  dataPath: envStr('DATA_PATH', './data'),
  /** Database flush interval in ms */
  dbSaveInterval: envInt('DB_SAVE_INTERVAL', 5000),
  /** Express JSON body size limit */
  jsonLimit: envStr('JSON_LIMIT', '1mb'),
  /** Static file Cache-Control max-age */
  staticMaxAge: envStr('STATIC_MAX_AGE', '1d'),
  /** Log level: 'debug' | 'info' | 'warn' | 'error' */
  logLevel: envStr('LOG_LEVEL', 'info'),
  /** Max log file size in bytes before rotation */
  logMaxSize: envInt('LOG_MAX_SIZE', 5 * 1024 * 1024),
  /** Default color for new lists */
  defaultListColor: envStr('DEFAULT_LIST_COLOR', '#4285f4'),
  /** Default list ID for tasks without explicit list */
  defaultListId: envInt('DEFAULT_LIST_ID', 1),
});
