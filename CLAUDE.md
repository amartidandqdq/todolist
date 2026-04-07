# TodoList — AI Agent Guide

Self-hosted Google Tasks clone. React + Express + SQLite + Docker + Tailscale.

## Architecture Map

```
server/
  index.ts                → Express app, barrel imports, plugin loader
  db/
    index.ts              → Barrel: creates DB singleton, applies schema
    types.ts              → DatabaseAdapter, PreparedStatement, RunResult interfaces
    wrapper.ts            → sql.js → better-sqlite3-compatible adapter (DI-ready)
    schema.ts             → Table DDL, indexes, migrations, seed data
  routes/
    index.ts              → Barrel: re-exports all route handlers
    lists.ts              → GET/POST/PUT/DELETE /api/lists
    tasks.ts              → GET/POST/PUT/DELETE /api/tasks + complete/star/reorder/indent
    subtasks.ts           → GET/POST /api/tasks/:id/subtasks
    batch.ts              → POST/PUT/DELETE /api/tasks/batch
    webhooks.ts           → GET/POST/DELETE /api/webhooks
    health.ts             → GET /api/health
    export.ts             → GET /api/export, POST /api/import
  utils/
    index.ts              → Barrel: computeNextDate, emitEvent
    recurrence.ts         → computeNextDate(due, rule) → next ISO date
    webhooks.ts           → emitEvent(name, payload) → POST to subscribers
  plugins/                → Drop .ts files here, auto-mounted at /api/*
  middleware/              → Reserved for custom Express middleware

client/src/
  main.tsx                → React entry point
  App.tsx                 → Root: wires hooks → components, undo, search, refresh
  types.ts                → Task, TaskList, SortMode, ViewMode (JSDoc'd)
  utils/
    index.ts              → Barrel: API, fetchJSON, formatDate, recurrenceLabel
    api.ts                → fetchJSON<T>(), ApiError class
    format.ts             → formatDate(), recurrenceLabel()
  hooks/
    index.ts              → Barrel: useLists, useTasks, useTheme
    useLists.ts           → CRUD hook for task lists
    useTasks.ts           → CRUD hook for tasks (filter/sort/search)
    useTheme.ts           → Light/dark/system theme with localStorage
  components/
    index.ts              → Barrel: all 14 components
    Sidebar.tsx           → Nav: lists, starred view, theme toggle, export/import
    TaskList.tsx           → Main view: DnD, sort, search, calendar, batch select
    TaskDetail.tsx         → Edit panel: title, notes, date/time, repeat
    TaskItem.tsx           → Task row: checkbox, star, inline edit, swipe (memo)
    SortableTask.tsx       → DnD wrapper via @dnd-kit/sortable
    SubtaskList.tsx        → Subtask rows (memo)
    SubtaskInput.tsx       → Add subtask inline
    CompletedSection.tsx   → Collapsible completed tasks (memo)
    AddTask.tsx            → Quick-add input (memo)
    SearchBar.tsx          → Expandable search with clear
    CalendarView.tsx       → Mini month calendar with task dots
    ListMenu.tsx           → 3-dot menu: rename/delete list
    ExportImport.tsx       → JSON export/import buttons
    UndoToast.tsx          → 5s toast with Undo action
  styles/
    globals.css            → Imports all sheets below (entry point)
    variables.css          → CSS tokens: light + dark + system themes
    base.css               → Reset, body, inputs, scrollbar
    sidebar.css            → Sidebar, list menu, export/import
    layout.css             → Main area, header, sort menu, add task, empty state
    task-item.css          → Task row, checkbox, star, actions, subtasks, completed
    detail.css             → Detail panel, form fields, repeat options
    widgets.css            → Toast, search bar, batch bar, calendar
    responsive.css         → Mobile/tablet breakpoints

openapi.yaml               → Full OpenAPI 3.1 spec
cli.sh                     → Shell CLI for terminal agents
```

## Conventions

- **One file = one responsibility.** Target <50 lines. Split if exceeding.
- **Barrel files** (`index.ts`) in every folder. Import from folder, not from file.
- **JSDoc** on every exported function: `@param`, `@returns`, purpose.
- **Explicit return types** on all functions.
- **Types** live in dedicated `types.ts` files. Never in hooks or components.
- **DI-ready**: `createDatabase(path)` accepts path injection. Routes import `db` from barrel.
- **CSS** atomic: one sheet per concern (layout, task-item, widgets, etc.).
- **No barrel re-exports across layers** (server doesn't import from client, vice versa).

## How to Add a Feature

### New API endpoint
1. Create `server/routes/myfeature.ts` with JSDoc'd route handlers
2. Add `export { default as myRoutes } from './myfeature.js'` to `server/routes/index.ts`
3. Mount in `server/index.ts`: `app.use('/api', myRoutes)`
4. Add to `openapi.yaml`

### New React component
1. Create `client/src/components/MyComponent.tsx` with Props interface + JSDoc
2. Add `export { default as MyComponent } from './MyComponent'` to components `index.ts`
3. Add styles in matching CSS file (or new file + import in `globals.css`)

### New task field
1. Migration in `server/db/schema.ts` (idempotent ALTER TABLE)
2. Update `client/src/types.ts` Task interface
3. Update route in `server/routes/tasks.ts`
4. Update `openapi.yaml`
5. Update `TaskDetail.tsx` (edit) + `TaskItem.tsx` or `utils/format.ts` (display)

### New plugin
Drop `server/plugins/myfeature.ts` exporting `{ router }`. Auto-loaded.

## Database

SQLite at `data/todolist.db`. Adapter in `server/db/wrapper.ts`.

| Table | Key columns |
|-------|------------|
| lists | id, name, color, position |
| tasks | id, list_id, parent_id, title, notes, due_date, due_time, completed, starred, position, recurrence_rule |
| webhooks | id, url, events (JSON), secret |

## Commands

```bash
npm run dev                      # Backend :3000
cd client && npm run dev         # Frontend :5173
docker compose up -d             # Production + Tailscale
./cli.sh health                  # Quick check
curl /api/openapi.yaml           # API spec
```
