/**
 * @module utils/logger
 * Zero-dependency structured logger. JSON-lines to logs/diagnostic.log, human-readable to stdout.
 * Each entry includes: timestamp, level, module, message, payload, stack, traceId.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_DIR = path.resolve(__dirname, '../../logs');
const LOG_FILE = path.join(LOG_DIR, 'diagnostic.log');

/** Lazy-loaded config to avoid circular imports at module init */
let _maxSize = 5 * 1024 * 1024;
let _logLevel = 'info';
let _configLoaded = false;

function loadConfig(): void {
  if (_configLoaded) return;
  try {
    // Dynamic import would be async; use env vars directly as fallback
    _maxSize = parseInt(process.env.LOG_MAX_SIZE || '', 10) || 5 * 1024 * 1024;
    _logLevel = process.env.LOG_LEVEL || 'info';
    _configLoaded = true;
  } catch { /* use defaults */ }
}

/** Active traceId for the current async context (set by requestId middleware) */
let _traceId: string | undefined;

/** Set the active traceId (called by requestId middleware) */
export function setTraceId(id: string): void { _traceId = id; }

/** Get the active traceId */
export function getTraceId(): string | undefined { return _traceId; }

let dirReady = false;
function ensureDir(): void {
  if (dirReady) return;
  fs.mkdirSync(LOG_DIR, { recursive: true });
  dirReady = true;
}

function rotateIfNeeded(): void {
  try {
    const stat = fs.statSync(LOG_FILE);
    if (stat.size > _maxSize) fs.renameSync(LOG_FILE, LOG_FILE + '.old');
  } catch { /* file doesn't exist yet */ }
}

/** Write a structured log entry (JSON to file, human-readable to stdout) */
function write(level: string, mod: string, msg: string, payload?: unknown, err?: unknown): void {
  loadConfig();
  ensureDir();
  rotateIfNeeded();
  const ts = new Date().toISOString();

  // JSON-lines for file (machine-parseable)
  const entry: Record<string, unknown> = { timestamp: ts, level, module: mod, message: msg };
  if (_traceId) entry.traceId = _traceId;
  if (payload !== undefined) entry.payload = payload;
  if (err instanceof Error) entry.stack = err.stack || err.message;
  else if (err) entry.stack = String(err);
  fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + '\n');

  // Human-readable for stdout
  let line = `[${ts}] [${level}] [${mod}] ${msg}`;
  if (_traceId) line += ` [TRACE] ${_traceId}`;
  if (payload !== undefined) line += ` [PAYLOAD] ${JSON.stringify(payload)}`;
  if (err instanceof Error) line += ` [STACK] ${err.stack || err.message}`;
  else if (err) line += ` [STACK] ${String(err)}`;
  console.log(line);
}

const LEVELS: Record<string, number> = { debug: 0, info: 1, warn: 2, error: 3 };

/**
 * Create a scoped logger for a module.
 * @param mod - Module name used as source tag
 * @returns Logger with debug, info, warn, error methods
 */
export function createLogger(mod: string) {
  const shouldLog = (level: string): boolean => (LEVELS[level] ?? 0) >= (LEVELS[_logLevel] ?? 1);
  return {
    debug: (msg: string): void => { loadConfig(); if (shouldLog('debug')) write('DEBUG', mod, msg); },
    info: (msg: string): void => { if (shouldLog('info')) write('INFO', mod, msg); },
    warn: (msg: string, payload?: unknown): void => { if (shouldLog('warn')) write('WARN', mod, msg, payload); },
    error: (msg: string, payload?: unknown, err?: unknown): void => { write('ERROR', mod, msg, payload, err); },
  };
}
