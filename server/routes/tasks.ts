import { Router, Request, Response } from 'express';
import db from '../db.js';
import { computeNextDate } from '../utils/recurrence.js';
import { emitEvent } from '../utils/webhooks.js';

const router = Router();

router.get('/tasks', (req: Request, res: Response) => {
  const { list_id, completed } = req.query;
  let sql = 'SELECT * FROM tasks WHERE parent_id IS NULL';
  const params: any[] = [];

  if (list_id) { sql += ' AND list_id = ?'; params.push(list_id); }
  if (completed !== undefined) { sql += ' AND completed = ?'; params.push(completed === 'true' ? 1 : 0); }

  sql += ' ORDER BY completed ASC, position ASC';
  const tasks = db.prepare(sql).all(...params);

  const withSubs = tasks.map((t: any) => ({
    ...t,
    subtasks: db.prepare('SELECT * FROM tasks WHERE parent_id = ? ORDER BY position').all(t.id),
  }));
  res.json(withSubs);
});

router.post('/tasks', (req: Request, res: Response) => {
  const { list_id, parent_id, title, notes, due_date, recurrence_rule } = req.body;
  const targetListId = list_id || 1;

  const maxPos = db.prepare(
    parent_id
      ? 'SELECT COALESCE(MAX(position), -1) as max FROM tasks WHERE parent_id = ?'
      : 'SELECT COALESCE(MAX(position), -1) as max FROM tasks WHERE list_id = ? AND parent_id IS NULL'
  ).get(parent_id || targetListId) as any;

  const result = db.prepare(
    'INSERT INTO tasks (list_id, parent_id, title, notes, due_date, position, recurrence_rule) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(targetListId, parent_id || null, title, notes || '', due_date || null, maxPos.max + 1, recurrence_rule || null);

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);
  emitEvent('task.created', task);
  res.status(201).json(task);
});

router.put('/tasks/:id', (req: Request, res: Response) => {
  const { title, notes, due_date, recurrence_rule, list_id } = req.body;
  db.prepare(`
    UPDATE tasks SET title = COALESCE(?, title), notes = COALESCE(?, notes),
      due_date = ?, recurrence_rule = ?, list_id = COALESCE(?, list_id), updated_at = datetime('now')
    WHERE id = ?
  `).run(title, notes, due_date ?? null, recurrence_rule ?? null, list_id, req.params.id);
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  emitEvent('task.updated', task);
  res.json(task);
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
    db.prepare('INSERT INTO tasks (list_id, parent_id, title, notes, due_date, position, recurrence_rule) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(task.list_id, null, task.title, task.notes, nextDate, maxPos.max + 1, task.recurrence_rule);
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

router.delete('/tasks/:id', (req: Request, res: Response) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
  emitEvent('task.deleted', task);
  res.status(204).end();
});

export default router;
