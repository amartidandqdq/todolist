import { Router, Request, Response } from 'express';
import db from '../db.js';

const router = Router();

router.get('/export', (_req: Request, res: Response) => {
  const lists = db.prepare('SELECT * FROM lists ORDER BY position').all();
  const tasks = db.prepare('SELECT * FROM tasks ORDER BY list_id, position').all();
  res.json({ version: 1, exported_at: new Date().toISOString(), lists, tasks });
});

router.post('/import', (req: Request, res: Response) => {
  const { lists, tasks } = req.body;
  if (!lists || !tasks) return res.status(400).json({ error: 'Invalid format' });

  const idMap: Record<number, number> = {};

  for (const l of lists) {
    const existing = db.prepare('SELECT id FROM lists WHERE id = ?').get(l.id);
    if (!existing) {
      db.prepare('INSERT INTO lists (id, name, color, position, created_at) VALUES (?, ?, ?, ?, ?)').run(l.id, l.name, l.color, l.position, l.created_at);
    }
    idMap[l.id] = l.id;
  }

  let imported = 0;
  for (const t of tasks) {
    const existing = db.prepare('SELECT id FROM tasks WHERE id = ?').get(t.id);
    if (!existing) {
      db.prepare('INSERT INTO tasks (list_id, parent_id, title, notes, due_date, due_time, completed, completed_at, starred, position, recurrence_rule, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .run(t.list_id, t.parent_id, t.title, t.notes, t.due_date, t.due_time || null, t.completed, t.completed_at, t.starred || 0, t.position, t.recurrence_rule, t.created_at, t.updated_at);
      imported++;
    }
  }

  res.json({ imported_lists: lists.length, imported_tasks: imported });
});

export default router;
