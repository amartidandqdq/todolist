/**
 * @module routes/lists
 * CRUD endpoints for task lists.
 * Endpoints: GET /lists, POST /lists, PUT /lists/:id, DELETE /lists/:id
 */
import { Router, Request, Response } from 'express';
import db from '../db/index.js';
import { emitEvent } from '../utils/webhooks.js';

const router = Router();

/** GET /lists — Return all lists ordered by position */
router.get('/lists', (_req: Request, res: Response): void => {
  res.json(db.prepare('SELECT * FROM lists ORDER BY position').all());
});

/** POST /lists — Create a new list */
router.post('/lists', (req: Request, res: Response): void => {
  const { name, color } = req.body as { name: string; color?: string };
  const maxPos = db.prepare('SELECT COALESCE(MAX(position), -1) as max FROM lists').get() as any;
  const result = db.prepare('INSERT INTO lists (name, color, position) VALUES (?, ?, ?)').run(name, color || '#4285f4', maxPos.max + 1);
  const list = db.prepare('SELECT * FROM lists WHERE id = ?').get(result.lastInsertRowid);
  emitEvent('list.created', list);
  res.status(201).json(list);
});

/** PUT /lists/:id — Update list name/color */
router.put('/lists/:id', (req: Request, res: Response): void => {
  const { name, color } = req.body as { name?: string; color?: string };
  db.prepare('UPDATE lists SET name = COALESCE(?, name), color = COALESCE(?, color) WHERE id = ?').run(name, color, req.params.id);
  res.json(db.prepare('SELECT * FROM lists WHERE id = ?').get(req.params.id));
});

/** DELETE /lists/:id — Delete a list and cascade-delete its tasks */
router.delete('/lists/:id', (req: Request, res: Response): void => {
  const list = db.prepare('SELECT * FROM lists WHERE id = ?').get(req.params.id);
  db.prepare('DELETE FROM lists WHERE id = ?').run(req.params.id);
  emitEvent('list.deleted', list);
  res.status(204).end();
});

export default router;
