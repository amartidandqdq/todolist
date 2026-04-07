/**
 * @module routes/health
 * Health check endpoint for monitoring and Docker HEALTHCHECK.
 * Endpoint: GET /health
 */
import { Router, Request, Response } from 'express';
import db from '../db/index.js';

const router = Router();

/** GET /health — Returns status, uptime, and counts */
router.get('/health', (_req: Request, res: Response): void => {
  try {
    const lists = db.prepare('SELECT COUNT(*) as count FROM lists').get() as any;
    const tasks = db.prepare('SELECT COUNT(*) as count FROM tasks').get() as any;
    res.json({ status: 'ok', uptime: process.uptime(), lists: lists.count, tasks: tasks.count });
  } catch (e) {
    res.status(500).json({ status: 'error', error: String(e) });
  }
});

export default router;
