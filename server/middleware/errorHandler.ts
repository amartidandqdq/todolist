/**
 * @module middleware/errorHandler
 * Global Express error handler. Logs diagnostic info and returns safe JSON.
 * Must be mounted AFTER all routes (4-arg signature signals Express error middleware).
 */
import { Request, Response, NextFunction } from 'express';
import { createLogger } from '../utils/logger.js';

const log = createLogger('errorHandler');

/**
 * Catch-all error handler for unhandled route errors.
 * Logs structured diagnostics to logs/diagnostic.log with traceId.
 * Never exposes stack traces to the client.
 * @param err - The thrown error
 * @param req - Express request
 * @param res - Express response
 * @param _next - Express next (required for 4-arg signature)
 */
export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction): void {
  const status = err.status || 500;
  log.error(err.message || 'Unhandled error', {
    method: req.method,
    url: req.originalUrl,
    body: req.body,
    traceId: res.locals.traceId,
  }, err);
  res.status(status).json({ error: err.message || 'Internal server error' });
}
