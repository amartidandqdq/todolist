import { Router, Request, Response } from 'express';
import db from '../db.js';
import { computeNextDate } from '../utils/recurrence.js';
import { emitEvent } from '../utils/webhooks.js';

const router = Router();

router.get('/tasks', (req: Request, res: Response) => {
  const { list_id, completed, starred, sort } = req.query;
  let sql = 'SELECT * FROM tasks WHERE parent_id IS NULL';
  const params: any[] = [];

  if (list_id) { sql += ' AND list_id = ?'; params.push(list_id); }
  if (completed !== undefined) { sql += ' AND completed = ?'; params.push(completed === 'true' ? 1 : 0); }
  if (starred === 'true') { sql += ' AND starred = 1'; }

  if (sort === 'date') sql += ' ORDER BY completed ASC, due_date IS NULL, due_date ASC, position ASC';
  else if (sort === 'starred') sql += ' ORDER BY completed ASC, starred DESC, updated_at DESC';
  else sql += ' ORDER BY completed ASC, position ASC';

  const tasks = db.prepare(sql).all(...params);
  const withSubs = tasks.map((t: any) => ({
    ...t,
    subtasks: db.prepare('SELECT * FROM tasks WHERE parent_id = ? ORDER BY position').all(t.id),
  }));
  res.json(withSubs);
});

router.post('/tasks', (req: Request, res: Response) => {
  const { list_id, parent_id, title, notes, due_date, due_time, recurrence_rule, starred } = req.body;
  const targetListId = list_id || 1;

  const maxPos = db.prepare(
    parent_id
      ? 'SELECT COALESCE(MAX(position), -1) as max FROM tasks WHERE parent_id = ?'
      : 'SELECT COALESCE(MAX(position), -1) as max FROM tasks WHERE list_id = ? AND parent_id IS NULL'
  ).get(parent_id || targetListId) as any;

  const result = db.prepare(
    'INSERT INTO tasks (list_id, parent_id, title, notes, due_date, due_time, position, recurrence_rule, starred) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(targetListId, parent_id || null, title, notes || '', due_date || null, due_time || null, maxPos.max + 1, recurrence_rule || null, starred ? 1 : 0);

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);
  emitEvent('task.created', task);
  res.status(201).json(task);
});

router.put('/tasks/:id', (req: Request, res: Response) => {
  const { title, notes, due_date, due_time, recurrence_rule, list_id, starred } = req.body;
  const sets: string[] = [];
  const params: any[] = [];

  if (title !== undefined) { sets.push('title = ?'); params.push(title); }
  if (notes !== undefined) { sets.push('notes = ?'); params.push(notes); }
  if (due_date !== undefined) { sets.push('due_date = ?'); params.push(due_date); }
  if (due_time !== undefined) { sets.push('due_time = ?'); params.push(due_time); }
  if (recurrence_rule !== undefined) { sets.push('recurrence_rule = ?'); params.push(recurrence_rule); }
  if (list_id !== undefined) { sets.push('list_id = ?'); params.push(list_id); }
  if (starred !== undefined) { sets.push('starred = ?'); params.push(starred ? 1 : 0); }
  sets.push("updated_at = datetime('now')");

  if (sets.length > 1) {
    db.prepare(`UPDATE tasks SET ${sets.join(', ')} WHERE id = ?`).run(...params, req.params.id);
  }

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  emitEvent('task.updated', task);
  res.json(task);
});

router.put('/tasks/:id/star', (req: Request, res: Response) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id) as any;
  if (!task) return res.status(404).json({ error: 'Not found' });
  const newStarred = task.starred ? 0 : 1;
  db.prepare("UPDATE tasks SET starred = ?, updated_at = datetime('now') WHERE id = ?").run(newStarred, req.params.id);
  res.json(db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id));
});

router.put('/tasks/:id/complete', (req: Request, res: Response) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id) as any;
  if (!task) return res.status(404).json({ error: 'Not found' });

  const newCompleted = task.completed ? 0 : 1;
  const now = newCompleted ? new Date().toISOString() : null;
  db.prepare("UPDATE tasks SET completed = ?, completed_at = ?, updated_at = datetime('now') WHERE id = ?").run(newCompleted, now, req.params.id);
  db.prepare("UPDATE tasks SET completed = ?, completed_at = ?, updated_at = datetime('now') WHERE parent_id = ?").run(newCompleted, now, req.params.id);

  if (newCompleted && task.recurrence_rule) {
    const rule = JSON.parse(task.recurrence_rule);
    const nextDate = computeNextDate(task.due_date, rule);
    const maxPos = db.prepare('SELECT COALESCE(MAX(position), -1) as max FROM tasks WHERE list_id = ? AND parent_id IS NULL').get(task.list_id) as any;
    db.prepare('INSERT INTO tasks (list_id, parent_id, title, notes, due_date, position, recurrence_rule, starred) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .run(task.list_id, null, task.title, task.notes, nextDate, maxPos.max + 1, task.recurrence_rule, task.starred);
  }

  const updated = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  emitEvent('task.completed', updated);
  res.json(updated);
});

router.put('/tasks/:id/reorder', (req: Request, res: Response) => {
  const { position, list_id } = req.body;
  db.prepare("UPDATE tasks SET position = ?, list_id = COALESCE(?, list_id), updated_at = datetime('now') WHERE id = ?").run(position, list_id, req.params.id);
  res.json({ ok: true });
});

router.put('/tasks/:id/indent', (req: Request, res: Response) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id) as any;
  if (!task || task.parent_id) return res.status(400).json({ error: 'Cannot indent' });

  const above = db.prepare('SELECT * FROM tasks WHERE list_id = ? AND parent_id IS NULL AND position < ? ORDER BY position DESC LIMIT 1')
    .get(task.list_id, task.position) as any;
  if (!above) return res.status(400).json({ error: 'No task above to indent under' });

  const maxPos = db.prepare('SELECT COALESCE(MAX(position), -1) as max FROM tasks WHERE parent_id = ?').get(above.id) as any;
  db.prepare("UPDATE tasks SET parent_id = ?, position = ?, updated_at = datetime('now') WHERE id = ?").run(above.id, maxPos.max + 1, req.params.id);
  res.json(db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id));
});

router.put('/tasks/:id/unindent', (req: Request, res: Response) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id) as any;
  if (!task || !task.parent_id) return res.status(400).json({ error: 'Cannot unindent' });

  const parent = db.prepare('SELECT * FROM tasks WHERE id = ?').get(task.parent_id) as any;
  const maxPos = db.prepare('SELECT COALESCE(MAX(position), -1) as max FROM tasks WHERE list_id = ? AND parent_id IS NULL').get(task.list_id) as any;
  db.prepare("UPDATE tasks SET parent_id = NULL, position = ?, updated_at = datetime('now') WHERE id = ?").run(maxPos.max + 1, req.params.id);
  res.json(db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id));
});

router.delete('/tasks/:id', (req: Request, res: Response) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
  emitEvent('task.deleted', task);
  res.status(204).end();
});

export default router;
