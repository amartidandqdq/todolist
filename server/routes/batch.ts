import { Router, Request, Response } from 'express';
import db from '../db/index.js';
import { findTask, nextPosition, validateArray } from '../utils/taskValidation.js';

const router = Router();

router.post('/tasks/batch', (req: Request, res: Response) => {
  const { tasks } = req.body;
  const err = validateArray(tasks, 'tasks');
  if (err) return res.status(400).json({ error: err });

  const insert = db.prepare(
    'INSERT INTO tasks (list_id, parent_id, title, notes, due_date, position, recurrence_rule) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );

  const created = db.transaction(() => {
    return tasks.map((t: any) => {
      const listId = t.list_id || 1;
      const pos = nextPosition({ listId });
      const result = insert.run(listId, null, t.title, t.notes || '', t.due_date || null, pos, t.recurrence_rule || null);
      return findTask(result.lastInsertRowid as number);
    });
  })();

  res.status(201).json(created);
});

router.put('/tasks/batch', (req: Request, res: Response) => {
  const { tasks } = req.body;
  const err = validateArray(tasks, 'tasks');
  if (err) return res.status(400).json({ error: err });

  const update = db.prepare(`
    UPDATE tasks SET title = COALESCE(?, title), notes = COALESCE(?, notes),
      due_date = COALESCE(?, due_date), list_id = COALESCE(?, list_id),
      completed = COALESCE(?, completed), updated_at = datetime('now')
    WHERE id = ?
  `);

  const updated = db.transaction(() => {
    return tasks.map((t: any) => {
      update.run(t.title, t.notes, t.due_date, t.list_id, t.completed !== undefined ? (t.completed ? 1 : 0) : null, t.id);
      return findTask(t.id);
    });
  })();

  res.json(updated);
});

router.delete('/tasks/batch', (req: Request, res: Response) => {
  const { ids } = req.body;
  const err = validateArray(ids, 'ids');
  if (err) return res.status(400).json({ error: err });

  const del = db.prepare('DELETE FROM tasks WHERE id = ?');
  const count = db.transaction(() => {
    let n = 0;
    for (const id of ids) { n += del.run(id).changes; }
    return n;
  })();

  res.json({ deleted: count });
});

export default router;
