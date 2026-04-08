import { Router, Request, Response } from 'express';
import db from '../db/index.js';
import { computeNextDate } from '../utils/recurrence.js';
import { findTask, nextPosition } from '../utils/taskValidation.js';
import { withWebhookEmit } from '../middleware/index.js';

const router = Router();

router.get('/tasks', (req: Request, res: Response) => {
  const { list_id, completed, starred, sort, q } = req.query;
  let sql = 'SELECT * FROM tasks WHERE parent_id IS NULL';
  const params: any[] = [];

  if (list_id) { sql += ' AND list_id = ?'; params.push(list_id); }
  if (completed !== undefined) { sql += ' AND completed = ?'; params.push(completed === 'true' ? 1 : 0); }
  if (starred === 'true') { sql += ' AND starred = 1'; }
  if (q) { sql += ' AND (title LIKE ? OR notes LIKE ?)'; params.push(`%${q}%`, `%${q}%`); }

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

router.post('/tasks', withWebhookEmit('task.created'), (req: Request, res: Response) => {
  const { list_id, parent_id, title, notes, due_date, due_time, recurrence_rule, starred } = req.body;
  const targetListId = list_id || 1;

  const pos = parent_id
    ? nextPosition({ parentId: parent_id })
    : nextPosition({ listId: targetListId });

  const result = db.prepare(
    'INSERT INTO tasks (list_id, parent_id, title, notes, due_date, due_time, position, recurrence_rule, starred) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(targetListId, parent_id || null, title, notes || '', due_date || null, due_time || null, pos, recurrence_rule || null, starred ? 1 : 0);

  res.status(201).json(findTask(result.lastInsertRowid as number));
});

router.put('/tasks/:id', withWebhookEmit('task.updated'), (req: Request, res: Response) => {
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

  res.json(findTask(Number(req.params.id)));
});

router.put('/tasks/:id/star', (req: Request, res: Response) => {
  const task = findTask(Number(req.params.id));
  if (!task) return res.status(404).json({ error: 'Not found' });
  const newStarred = task.starred ? 0 : 1;
  db.prepare("UPDATE tasks SET starred = ?, updated_at = datetime('now') WHERE id = ?").run(newStarred, req.params.id);
  res.json(findTask(Number(req.params.id)));
});

router.put('/tasks/:id/complete', withWebhookEmit('task.completed'), (req: Request, res: Response) => {
  const task = findTask(Number(req.params.id));
  if (!task) return res.status(404).json({ error: 'Not found' });

  const newCompleted = task.completed ? 0 : 1;
  const now = newCompleted ? new Date().toISOString() : null;
  db.prepare("UPDATE tasks SET completed = ?, completed_at = ?, updated_at = datetime('now') WHERE id = ?").run(newCompleted, now, req.params.id);
  db.prepare("UPDATE tasks SET completed = ?, completed_at = ?, updated_at = datetime('now') WHERE parent_id = ?").run(newCompleted, now, req.params.id);

  if (newCompleted && task.recurrence_rule) {
    const rule = JSON.parse(task.recurrence_rule);
    const nextDate = computeNextDate(task.due_date, rule);
    const pos = nextPosition({ listId: task.list_id });
    db.prepare('INSERT INTO tasks (list_id, parent_id, title, notes, due_date, position, recurrence_rule, starred) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .run(task.list_id, null, task.title, task.notes, nextDate, pos, task.recurrence_rule, task.starred);
  }

  res.json(findTask(Number(req.params.id)));
});

router.put('/tasks/:id/reorder', (req: Request, res: Response) => {
  const { position, list_id } = req.body;
  db.prepare("UPDATE tasks SET position = ?, list_id = COALESCE(?, list_id), updated_at = datetime('now') WHERE id = ?").run(position, list_id, req.params.id);
  res.json({ ok: true });
});

router.put('/tasks/:id/indent', (req: Request, res: Response) => {
  const task = findTask(Number(req.params.id));
  if (!task || task.parent_id) return res.status(400).json({ error: 'Cannot indent' });

  const above = db.prepare('SELECT * FROM tasks WHERE list_id = ? AND parent_id IS NULL AND position < ? ORDER BY position DESC LIMIT 1')
    .get(task.list_id, task.position) as any;
  if (!above) return res.status(400).json({ error: 'No task above to indent under' });

  const pos = nextPosition({ parentId: above.id });
  db.prepare("UPDATE tasks SET parent_id = ?, position = ?, updated_at = datetime('now') WHERE id = ?").run(above.id, pos, req.params.id);
  res.json(findTask(Number(req.params.id)));
});

router.put('/tasks/:id/unindent', (req: Request, res: Response) => {
  const task = findTask(Number(req.params.id));
  if (!task || !task.parent_id) return res.status(400).json({ error: 'Cannot unindent' });

  const pos = nextPosition({ listId: task.list_id });
  db.prepare("UPDATE tasks SET parent_id = NULL, position = ?, updated_at = datetime('now') WHERE id = ?").run(pos, req.params.id);
  res.json(findTask(Number(req.params.id)));
});

router.delete('/tasks/:id', withWebhookEmit('task.deleted'), (req: Request, res: Response) => {
  res.locals.webhookPayload = findTask(Number(req.params.id));
  db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
  res.json({ deleted: true });
});

export default router;
