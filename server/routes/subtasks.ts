/**
 * @module routes/subtasks
 * Endpoints for managing subtasks within a parent task.
 * Endpoints: GET /tasks/:id/subtasks, POST /tasks/:id/subtasks
 */
import { Router, Request, Response } from 'express';
import db from '../db/index.js';

const router = Router();

/** GET /tasks/:id/subtasks — List subtasks for a parent task */
router.get('/tasks/:id/subtasks', (req: Request, res: Response): void => {
  res.json(db.prepare('SELECT * FROM tasks WHERE parent_id = ? ORDER BY position').all(req.params.id));
});

/** POST /tasks/:id/subtasks — Add a subtask under the given parent */
router.post('/tasks/:id/subtasks', (req: Request, res: Response): void => {
  const parent = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id) as any;
  if (!parent) { res.status(404).json({ error: 'Parent not found' }); return; }

  const { title } = req.body as { title: string };
  const maxPos = db.prepare('SELECT COALESCE(MAX(position), -1) as max FROM tasks WHERE parent_id = ?').get(req.params.id) as any;
  const result = db.prepare('INSERT INTO tasks (list_id, parent_id, title, position) VALUES (?, ?, ?, ?)')
    .run(parent.list_id, req.params.id, title, maxPos.max + 1);
  res.status(201).json(db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid));
});

export default router;
