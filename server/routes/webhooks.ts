import { Router, Request, Response } from 'express';
import db from '../db.js';

const router = Router();

// Init webhooks table
db.exec(`
  CREATE TABLE IF NOT EXISTS webhooks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT NOT NULL,
    events TEXT NOT NULL,
    secret TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

router.get('/webhooks', (_req: Request, res: Response) => {
  const webhooks = db.prepare('SELECT id, url, events, created_at FROM webhooks').all();
  res.json(webhooks.map((w: any) => ({ ...w, events: JSON.parse(w.events) })));
});

router.post('/webhooks', (req: Request, res: Response) => {
  const { url, events, secret } = req.body;
  if (!url || !events) return res.status(400).json({ error: 'url and events required' });

  const result = db.prepare('INSERT INTO webhooks (url, events, secret) VALUES (?, ?, ?)')
    .run(url, JSON.stringify(events), secret || null);
  const webhook = db.prepare('SELECT id, url, events, created_at FROM webhooks WHERE id = ?').get(result.lastInsertRowid) as any;
  res.status(201).json({ ...webhook, events: JSON.parse(webhook.events) });
});

router.delete('/webhooks/:id', (req: Request, res: Response) => {
  db.prepare('DELETE FROM webhooks WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

export default router;
