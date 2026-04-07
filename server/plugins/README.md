# Plugins

Drop `.ts` or `.js` files here to extend the API.

Each plugin must export a default object with a `router` property (Express Router).

## Example: `hello.ts`

```typescript
import { Router } from 'express';

const router = Router();
router.get('/hello', (_req, res) => res.json({ message: 'Hello from plugin!' }));

export default { router };
```

The plugin auto-loads on server start and mounts at `/api/hello`.

## Plugin capabilities

- Full access to Express Router (add any GET/POST/PUT/DELETE route)
- Import `db` from `../db.js` for database access
- Import `emitEvent` from `../utils/webhooks.js` to fire webhook events
