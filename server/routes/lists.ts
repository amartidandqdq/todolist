import { Router, Request, Response } from 'express';
import db from '../db.js';

const router = Router();

router.get('/lists', (_req: Request, res: Response) => {
  const lists = db.prepare('SELECT * FROM lists ORDER BY position').all();
  res.json(lists);
});

router.post('/lists', (req: Request, res: Response) => {
  const { name, color } = req.body;
  const maxPos = db.prepare('SELECT COALESCE(MAX(position), -1) as max FROM lists').get() as any;
  const result = db.prepare('INSERT INTO lists (name, color, position) VALUES (?, ?, ?)').run(name, color || '#4285f4', maxPos.max + 1);
  const list = db.prepare('SELECT * FROM lists WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(list);
});

router.put('/lists/:id', (req: Request, res: Response) => {
  const { name, color } = req.body;
  db.prepare('UPDATE lists SET name = COALESCE(?, name), color = COALESCE(?, color) WHERE id = ?').run(name, color, req.params.id);
  const list = db.prepare('SELECT * FROM lists WHERE id = ?').get(req.params.id);
  res.json(list);
});

router.delete('/lists/:id', (req: Request, res: Response) => {
  db.prepare('DELETE FROM lists WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

export default router;
