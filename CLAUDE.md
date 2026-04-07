# TodoList — AI Agent Guide

Self-hosted Google Tasks clone. React + Express + SQLite + Docker + Tailscale.

## Architecture Map

```
server/
  index.ts              → Express app, mounts routers, loads plugins, serves spec
  db.ts                 → SQLite init, schema, migrations, indexes
  routes/
    lists.ts            → GET/POST/PUT/DELETE /api/lists
    tasks.ts            → GET/POST/PUT/DELETE /api/tasks, complete, reorder
    subtasks.ts         → GET/POST /api/tasks/:id/subtasks
    batch.ts            → POST/PUT/DELETE /api/tasks/batch (bulk operations)
    webhooks.ts         → GET/POST/DELETE /api/webhooks (event subscriptions)
    health.ts           → GET /api/health (status + counts)
  utils/
    recurrence.ts       → computeNextDate() for recurring tasks
    webhooks.ts         → emitEvent() fires registered webhooks
  middleware/            → (empty, for custom middleware)
  plugins/              → Drop .ts files here to auto-register new routes

client/src/
  main.tsx              → React entry point
  App.tsx               → Root component, wires hooks to components
  types.ts              → Task and TaskList interfaces (shared types)
  utils/
    api.ts              → fetchJSON() helper, ApiError class
    format.ts           → formatDate(), recurrenceLabel() display helpers
  hooks/
    useLists.ts         → useLists() — CRUD for task lists
    useTasks.ts         → useTasks(listId) — CRUD for tasks + subtasks
  components/
    Sidebar.tsx         → List navigation sidebar
    AddTask.tsx         → Quick-add task input (memo)
    TaskItem.tsx        → Single task row (memo, delegates to SubtaskList/SubtaskInput)
    SubtaskList.tsx     → Renders subtasks (memo)
    SubtaskInput.tsx    → Add subtask inline input
    SortableTask.tsx    → Drag-and-drop wrapper (dnd-kit)
    CompletedSection.tsx→ Completed tasks toggle section (memo)
    TaskList.tsx        → Main view: task list + drag-drop + detail panel
    TaskDetail.tsx      → Side panel to edit task details
  styles/
    globals.css         → Imports all CSS files below
    variables.css       → CSS custom properties (colors, spacing)
    base.css            → Reset, body, inputs, scrollbar
    sidebar.css         → Sidebar component styles
    task.css            → Task items, checkboxes, add form, completed section
    detail.css          → Task detail panel styles
    responsive.css      → Mobile/tablet breakpoints

openapi.yaml            → Full OpenAPI 3.1 spec (agent-readable)
cli.sh                  → CLI wrapper for terminal-based agents
```

## Agent Integration

### API Discovery

The full OpenAPI spec is served at:
```
GET /api/openapi.yaml
```

Any agent framework that supports OpenAPI (LangChain, CrewAI, AutoGPT, etc.) can auto-discover all endpoints.

### CLI (for terminal agents)

```bash
export TODOLIST_URL=https://todolist.example.ts.net

./cli.sh lists                          # List all lists
./cli.sh tasks                          # List all tasks
./cli.sh tasks 1                        # Tasks in list 1
./cli.sh add "Buy groceries"            # Create task
./cli.sh add "Meeting" --due 2026-04-10 --recur weekly
./cli.sh done 5                         # Toggle complete
./cli.sh edit 5 title "New title"       # Update field
./cli.sh rm 5                           # Delete
./cli.sh sub 3 "Buy milk"              # Add subtask
./cli.sh batch-add "Task 1" "Task 2" "Task 3"
./cli.sh health                         # Status check
```

### Batch Operations

Create, update, or delete many tasks in one call:

```bash
# Create multiple
curl -X POST /api/tasks/batch \
  -H 'Content-Type: application/json' \
  -d '{"tasks":[{"title":"A"},{"title":"B","due_date":"2026-04-10"}]}'

# Update multiple
curl -X PUT /api/tasks/batch \
  -H 'Content-Type: application/json' \
  -d '{"tasks":[{"id":1,"completed":true},{"id":2,"title":"Renamed"}]}'

# Delete multiple
curl -X DELETE /api/tasks/batch \
  -H 'Content-Type: application/json' \
  -d '{"ids":[1,2,3]}'
```

### Webhooks (event-driven agents)

Register a URL to receive POST notifications on events:

```bash
# Register
curl -X POST /api/webhooks \
  -H 'Content-Type: application/json' \
  -d '{"url":"https://my-agent.example/hook","events":["task.created","task.completed"]}'

# Events: task.created, task.updated, task.completed, task.deleted, list.created, list.deleted

# Payload sent to your URL:
# {"event":"task.created","data":{...task object},"timestamp":"..."}

# Optional HMAC signature via X-Webhook-Signature header (set "secret" field)
```

### Plugins (extend the API)

Drop a `.ts` file in `server/plugins/` to add new routes:

```typescript
// server/plugins/priority.ts
import { Router } from 'express';
import db from '../db.js';

const router = Router();
router.get('/tasks/priority', (_req, res) => {
  const urgent = db.prepare("SELECT * FROM tasks WHERE due_date <= date('now','+1 day') AND completed = 0").all();
  res.json(urgent);
});

export default { router };
```

Plugins auto-load on server start. No core code modification needed.

## Conventions

- **One file = one responsibility.** Each file <50 lines when possible.
- **Types** live in `client/src/types.ts`. Import from there, not from hooks.
- **API calls** go through `fetchJSON()` in `utils/api.ts`.
- **Formatting** helpers in `utils/format.ts`, not in components.
- **CSS** split by component area. Edit the specific file, not globals.css.
- **Backend routes** one file per resource (lists, tasks, subtasks, batch, webhooks).
- **Webhook events** emit via `emitEvent()` from `server/utils/webhooks.ts`.
- **No barrel files.** Import directly from the source file.

## How to Add a Feature

### New API endpoint
1. Create `server/routes/myfeature.ts` or `server/plugins/myfeature.ts`
2. If route file: mount in `server/index.ts`. If plugin: auto-loaded.
3. Add to `openapi.yaml`
4. Add fetch call in the matching hook or create a new hook

### New UI component
1. Create `client/src/components/MyComponent.tsx`
2. Keep under 50 lines — extract sub-components if needed
3. Add styles in matching CSS file (or create new + import in globals.css)
4. Wire in parent component

### New task field
1. Add column in `server/db.ts` schema
2. Update `client/src/types.ts`
3. Update route in `server/routes/tasks.ts`
4. Update `openapi.yaml`
5. Update `TaskDetail.tsx` for edit form
6. Update `TaskItem.tsx` or `utils/format.ts` for display

## Database

SQLite at `data/todolist.db`. Tables:
- **lists**: id, name, color, position, created_at
- **tasks**: id, list_id, parent_id, title, notes, due_date, completed, completed_at, position, recurrence_rule, created_at, updated_at
- **webhooks**: id, url, events (JSON), secret, created_at

## Commands

```bash
npm run dev              # Backend dev server (:3000)
cd client && npm run dev # Frontend dev server (:5173)
docker compose up -d     # Production with Tailscale
./cli.sh health          # Quick status check
```
