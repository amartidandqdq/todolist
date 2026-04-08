import db from '../db/index.js';
import { createHmac } from 'crypto';
import { createLogger } from './logger.js';

const log = createLogger('webhooks');

/** Webhook row as stored in SQLite */
interface WebhookRow {
  id: number;
  url: string;
  events: string;
  secret: string | null;
}

/**
 * Fire a webhook event to all registered listeners.
 * Non-blocking — errors are silently caught per webhook.
 * @param event - Event name (e.g. 'task.created', 'task.completed')
 * @param payload - Event data (typically the affected task/list object)
 */
export async function emitEvent(event: string, payload: unknown): Promise<void> {
  const webhooks = db.prepare('SELECT * FROM webhooks').all() as WebhookRow[];

  for (const wh of webhooks) {
    const events = JSON.parse(wh.events) as string[];
    if (!events.includes(event) && !events.includes('*')) continue;

    const body = JSON.stringify({ event, data: payload, timestamp: new Date().toISOString() });
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };

    if (wh.secret) {
      headers['X-Webhook-Signature'] = createHmac('sha256', wh.secret).update(body).digest('hex');
    }

    fetch(wh.url, { method: 'POST', headers, body })
      .catch((err: Error) => log.warn(`Delivery to ${wh.url} failed: ${err.message}`, { event, webhookId: wh.id }));
  }
}
