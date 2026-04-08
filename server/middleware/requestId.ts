/**
 * @module middleware/requestId
 * Generates a unique traceId per request for log correlation.
 * Sets it in both res.locals and the logger's active traceId.
 */
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { setTraceId } from '../utils/logger.js';

/**
 * Attach a unique traceId to every incoming request.
 * @param _req - Express request
 * @param res - Express response (traceId stored in res.locals)
 * @param next - Express next
 */
export function requestId(_req: Request, res: Response, next: NextFunction): void {
  const id = randomUUID();
  res.locals.traceId = id;
  setTraceId(id);
  next();
}
