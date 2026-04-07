import { Router, Request, Response } from 'express';
import db from '../db/index.js';

const router = Router();

router.post('/tasks/batch', (req: Request, res: Response) => {
  const { tasks } = req.body;
  if (!Array.isArray(tasks)) return res.status(400).json({ error: 'tasks must be an array' });

  const insert = db.prepare(
    'INSERT INTO tasks (list_id, parent_id, title, notes, due_date, position, recurrence_rule) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );
  const getMaxPos = db.prepare('SELECT COALESCE(MAX(position), -1) as max FROM tasks WHERE list_id = ? AND parent_id IS NULL');

  const created = db.transaction(() => {
    return tasks.map((t: any) => {
      const listId = t.list_id || 1;
      const maxPos = getMaxPos.get(listId) as any;
      const result = insert.run(listId, null, t.title, t.notes || '', t.due_date || null, maxPos.max + 1, t.recurrence_rule || null);
      return db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);
    });
  })();

  res.status(201).json(created);
});

router.put('/tasks/batch', (req: Request, res: Response) => {
  const { tasks } = req.body;
  if (!Array.isArray(tasks)) return res.status(400).json({ error: 'tasks must be an array' });

  const update = db.prepare(`
    UPDATE tasks SET title = COALESCE(?, title), notes = COALESCE(?, notes),
      due_date = COALESCE(?, due_date), list_id = COALESCE(?, list_id),
      completed = COALESCE(?, completed), updated_at = datetime('now')
    WHERE id = ?
  `);

  const updated = db.transaction(() => {
    return tasks.map((t: any) => {
      update.run(t.title, t.notes, t.due_date, t.list_id, t.completed !== undefined ? (t.completed ? 1 : 0) : null, t.id);
      return db.prepare('SELECT * FROM tasks WHERE id = ?').get(t.id);
    });
  })();

  res.json(updated);
});

router.delete('/tasks/batch', (req: Request, res: Response) => {
  const { ids } = req.body;
  if (!Array.isArray(ids)) return res.status(400).json({ error: 'ids must be an array' });

  const del = db.prepare('DELETE FROM tasks WHERE id = ?');
  const count = db.transaction(() => {
    let n = 0;
    for (const id of ids) { n += del.run(id).changes; }
    return n;
  })();

  res.json({ deleted: count });
});

export default router;
