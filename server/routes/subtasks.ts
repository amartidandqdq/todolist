/**
 * @module routes/subtasks
 * Endpoints for managing subtasks within a parent task.
 * Endpoints: GET /tasks/:id/subtasks, POST /tasks/:id/subtasks
 */
import { Router, Request, Response } from 'express';
import db from '../db/index.js';
import { findTask, nextPosition } from '../utils/taskValidation.js';

const router = Router();

/** GET /tasks/:id/subtasks — List subtasks for a parent task */
router.get('/tasks/:id/subtasks', (req: Request, res: Response): void => {
  res.json(db.prepare('SELECT * FROM tasks WHERE parent_id = ? ORDER BY position').all(req.params.id));
});

/** POST /tasks/:id/subtasks — Add a subtask under the given parent */
router.post('/tasks/:id/subtasks', (req: Request, res: Response): void => {
  const parent = findTask(Number(req.params.id));
  if (!parent) { res.status(404).json({ error: 'Parent not found' }); return; }

  const { title } = req.body as { title: string };
  const pos = nextPosition({ parentId: req.params.id });
  const result = db.prepare('INSERT INTO tasks (list_id, parent_id, title, position) VALUES (?, ?, ?, ?)')
    .run(parent.list_id, req.params.id, title, pos);
  res.status(201).json(findTask(result.lastInsertRowid as number));
});

export default router;
