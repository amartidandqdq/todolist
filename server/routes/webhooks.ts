/**
 * @module routes/webhooks
 * Manage webhook subscriptions for event-driven integrations.
 * Endpoints: GET /webhooks, POST /webhooks, DELETE /webhooks/:id
 */
import { Router, Request, Response } from 'express';
import db from '../db/index.js';

const router = Router();

/** GET /webhooks — List all registered webhooks */
router.get('/webhooks', (_req: Request, res: Response): void => {
  const webhooks = db.prepare('SELECT id, url, events, created_at FROM webhooks').all();
  res.json(webhooks.map((w: any) => ({ ...w, events: JSON.parse(w.events) })));
});

/** POST /webhooks — Register a new webhook */
router.post('/webhooks', (req: Request, res: Response): void => {
  const { url, events, secret } = req.body as { url: string; events: string[]; secret?: string };
  if (!url || !events) { res.status(400).json({ error: 'url and events required' }); return; }

  const result = db.prepare('INSERT INTO webhooks (url, events, secret) VALUES (?, ?, ?)')
    .run(url, JSON.stringify(events), secret || null);
  const webhook = db.prepare('SELECT id, url, events, created_at FROM webhooks WHERE id = ?').get(result.lastInsertRowid) as any;
  res.status(201).json({ ...webhook, events: JSON.parse(webhook.events) });
});

/** DELETE /webhooks/:id — Remove a webhook subscription */
router.delete('/webhooks/:id', (req: Request, res: Response): void => {
  db.prepare('DELETE FROM webhooks WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

export default router;
