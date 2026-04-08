/**
 * @module middleware/withWebhookEmit
 * Express middleware that auto-fires webhooks after successful mutations.
 * Decouples webhook emission from route logic (Open/Closed Principle).
 */
import { Request, Response, NextFunction } from 'express';
import { emitEvent } from '../utils/webhooks.js';

/**
 * Wrap a route handler so that on success (2xx), the specified webhook event
 * fires with `res.locals.webhookPayload` (or the JSON body sent in the response).
 *
 * Usage in a route:
 *   router.post('/tasks', withWebhookEmit('task.created'), (req, res) => { ... });
 *
 * The handler sets `res.locals.webhookPayload` if it wants to control the payload.
 * If not set, the middleware reads the response body automatically.
 *
 * @param event - Webhook event name (e.g. 'task.created')
 * @returns Express middleware
 */
export function withWebhookEmit(event: string) {
  return (_req: Request, res: Response, next: NextFunction): void => {
    const originalJson = res.json.bind(res);

    res.json = function (body: unknown) {
      const result = originalJson(body);
      // Fire webhook after response is sent, non-blocking
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const payload = res.locals.webhookPayload ?? body;
        emitEvent(event, payload);
      }
      return result;
    };

    next();
  };
}
