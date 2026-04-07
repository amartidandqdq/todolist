import db from '../db.js';
import { createHmac } from 'crypto';

interface WebhookRow {
  id: number;
  url: string;
  events: string;
  secret: string | null;
}

export async function emitEvent(event: string, payload: any) {
  const webhooks = db.prepare('SELECT * FROM webhooks').all() as WebhookRow[];

  for (const wh of webhooks) {
    const events = JSON.parse(wh.events) as string[];
    if (!events.includes(event) && !events.includes('*')) continue;

    const body = JSON.stringify({ event, data: payload, timestamp: new Date().toISOString() });
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };

    if (wh.secret) {
      headers['X-Webhook-Signature'] = createHmac('sha256', wh.secret).update(body).digest('hex');
    }

    fetch(wh.url, { method: 'POST', headers, body }).catch(() => {});
  }
}
