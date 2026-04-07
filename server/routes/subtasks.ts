import { Router, Request, Response } from 'express';
import db from '../db.js';

const router = Router();

router.get('/tasks/:id/subtasks', (req: Request, res: Response) => {
  const subtasks = db.prepare('SELECT * FROM tasks WHERE parent_id = ? ORDER BY position').all(req.params.id);
  res.json(subtasks);
});

router.post('/tasks/:id/subtasks', (req: Request, res: Response) => {
  const parent = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id) as any;
  if (!parent) return res.status(404).json({ error: 'Parent not found' });

  const { title } = req.body;
  const maxPos = db.prepare('SELECT COALESCE(MAX(position), -1) as max FROM tasks WHERE parent_id = ?').get(req.params.id) as any;
  const result = db.prepare('INSERT INTO tasks (list_id, parent_id, title, position) VALUES (?, ?, ?, ?)')
    .run(parent.list_id, req.params.id, title, maxPos.max + 1);
  const subtask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(subtask);
});

export default router;
