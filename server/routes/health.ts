import { Router, Request, Response } from 'express';
import db from '../db.js';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  try {
    const lists = db.prepare('SELECT COUNT(*) as count FROM lists').get() as any;
    const tasks = db.prepare('SELECT COUNT(*) as count FROM tasks').get() as any;
    res.json({
      status: 'ok',
      uptime: process.uptime(),
      lists: lists.count,
      tasks: tasks.count,
    });
  } catch (e) {
    res.status(500).json({ status: 'error', error: String(e) });
  }
});

export default router;
