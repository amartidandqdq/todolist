import { Router, Request, Response } from 'express';
import db from '../db.js';

const router = Router();

// === LISTS ===

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

// === TASKS ===

router.get('/tasks', (req: Request, res: Response) => {
  const { list_id, completed } = req.query;
  let sql = 'SELECT * FROM tasks WHERE parent_id IS NULL';
  const params: any[] = [];

  if (list_id) {
    sql += ' AND list_id = ?';
    params.push(list_id);
  }
  if (completed !== undefined) {
    sql += ' AND completed = ?';
    params.push(completed === 'true' ? 1 : 0);
  }

  sql += ' ORDER BY completed ASC, position ASC';
  const tasks = db.prepare(sql).all(...params);

  // Attach subtasks
  const withSubs = tasks.map((t: any) => ({
    ...t,
    subtasks: db.prepare('SELECT * FROM tasks WHERE parent_id = ? ORDER BY position').all(t.id),
  }));

  res.json(withSubs);
});

router.post('/tasks', (req: Request, res: Response) => {
  const { list_id, parent_id, title, notes, due_date, recurrence_rule } = req.body;
  const targetListId = list_id || 1;
  const parentCol = parent_id ? 'parent_id' : null;

  const maxPos = db.prepare(
    parent_id
      ? 'SELECT COALESCE(MAX(position), -1) as max FROM tasks WHERE parent_id = ?'
      : 'SELECT COALESCE(MAX(position), -1) as max FROM tasks WHERE list_id = ? AND parent_id IS NULL'
  ).get(parent_id || targetListId) as any;

  const result = db.prepare(
    'INSERT INTO tasks (list_id, parent_id, title, notes, due_date, position, recurrence_rule) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(targetListId, parent_id || null, title, notes || '', due_date || null, maxPos.max + 1, recurrence_rule || null);

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(task);
});

router.put('/tasks/:id', (req: Request, res: Response) => {
  const { title, notes, due_date, recurrence_rule, list_id } = req.body;
  db.prepare(`
    UPDATE tasks SET
      title = COALESCE(?, title),
      notes = COALESCE(?, notes),
      due_date = ?,
      recurrence_rule = ?,
      list_id = COALESCE(?, list_id),
      updated_at = datetime('now')
    WHERE id = ?
  `).run(title, notes, due_date ?? null, recurrence_rule ?? null, list_id, req.params.id);

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  res.json(task);
});

router.put('/tasks/:id/complete', (req: Request, res: Response) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id) as any;
  if (!task) return res.status(404).json({ error: 'Not found' });

  const newCompleted = task.completed ? 0 : 1;
  db.prepare('UPDATE tasks SET completed = ?, completed_at = ?, updated_at = datetime(\'now\') WHERE id = ?')
    .run(newCompleted, newCompleted ? new Date().toISOString() : null, req.params.id);

  // Also complete/uncomplete subtasks
  db.prepare('UPDATE tasks SET completed = ?, completed_at = ?, updated_at = datetime(\'now\') WHERE parent_id = ?')
    .run(newCompleted, newCompleted ? new Date().toISOString() : null, req.params.id);

  // Handle recurrence: if completing and has rule, create next occurrence
  if (newCompleted && task.recurrence_rule) {
    const rule = JSON.parse(task.recurrence_rule);
    const nextDate = computeNextDate(task.due_date, rule);
    const maxPos = db.prepare('SELECT COALESCE(MAX(position), -1) as max FROM tasks WHERE list_id = ? AND parent_id IS NULL').get(task.list_id) as any;
    db.prepare(
      'INSERT INTO tasks (list_id, parent_id, title, notes, due_date, position, recurrence_rule) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(task.list_id, null, task.title, task.notes, nextDate, maxPos.max + 1, task.recurrence_rule);
  }

  const updated = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  res.json(updated);
});

router.put('/tasks/:id/reorder', (req: Request, res: Response) => {
  const { position, list_id } = req.body;
  db.prepare('UPDATE tasks SET position = ?, list_id = COALESCE(?, list_id), updated_at = datetime(\'now\') WHERE id = ?')
    .run(position, list_id, req.params.id);
  res.json({ ok: true });
});

router.delete('/tasks/:id', (req: Request, res: Response) => {
  db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

// === SUBTASKS (convenience) ===

router.get('/tasks/:id/subtasks', (req: Request, res: Response) => {
  const subtasks = db.prepare('SELECT * FROM tasks WHERE parent_id = ? ORDER BY position').all(req.params.id);
  res.json(subtasks);
});

router.post('/tasks/:id/subtasks', (req: Request, res: Response) => {
  const parent = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id) as any;
  if (!parent) return res.status(404).json({ error: 'Parent not found' });

  const { title } = req.body;
  const maxPos = db.prepare('SELECT COALESCE(MAX(position), -1) as max FROM tasks WHERE parent_id = ?').get(req.params.id) as any;
  const result = db.prepare('INSERT INTO tasks (list_id, parent_id, title, position) VALUES (?, ?, ?, ?)')
    .run(parent.list_id, req.params.id, title, maxPos.max + 1);
  const subtask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(subtask);
});

// === HELPERS ===

function computeNextDate(currentDue: string | null, rule: { freq: string; interval?: number }): string {
  const base = currentDue ? new Date(currentDue) : new Date();
  const interval = rule.interval || 1;

  switch (rule.freq) {
    case 'daily':
      base.setDate(base.getDate() + interval);
      break;
    case 'weekly':
      base.setDate(base.getDate() + 7 * interval);
      break;
    case 'monthly':
      base.setMonth(base.getMonth() + interval);
      break;
  }

  return base.toISOString().split('T')[0];
}

export default router;
