# TodoList — AI Agent Guide

Self-hosted Google Tasks clone. React + Express + SQLite + Docker + Tailscale.

## Architecture Map

```
server/
  index.ts              → Express app, mounts routers, serves static files
  db.ts                 → SQLite init, schema, migrations
  routes/
    lists.ts            → GET/POST/PUT/DELETE /api/lists
    tasks.ts            → GET/POST/PUT/DELETE /api/tasks, complete, reorder
    subtasks.ts         → GET/POST /api/tasks/:id/subtasks
  utils/
    recurrence.ts       → computeNextDate() for recurring tasks

client/src/
  main.tsx              → React entry point
  App.tsx               → Root component, wires hooks to components
  types.ts              → Task and TaskList interfaces (shared types)
  utils/
    api.ts              → fetchJSON() helper, API base URL
    format.ts           → formatDate(), recurrenceLabel() display helpers
  hooks/
    useLists.ts         → useLists() — CRUD for task lists
    useTasks.ts         → useTasks(listId) — CRUD for tasks + subtasks
  components/
    Sidebar.tsx         → List navigation sidebar
    AddTask.tsx         → Quick-add task input
    TaskItem.tsx        → Single task row (delegates to SubtaskList/SubtaskInput)
    SubtaskList.tsx     → Renders subtasks for a task
    SubtaskInput.tsx    → Add subtask inline input
    SortableTask.tsx    → Drag-and-drop wrapper (dnd-kit)
    CompletedSection.tsx→ Completed tasks toggle section
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
```

## Conventions

- **One file = one responsibility.** Each file <50 lines when possible.
- **Types** live in `client/src/types.ts`. Import from there, not from hooks.
- **API calls** go through `fetchJSON()` in `utils/api.ts`.
- **Formatting** helpers in `utils/format.ts`, not in components.
- **CSS** split by component area. Edit the specific file, not globals.css.
- **Backend routes** one file per resource (lists, tasks, subtasks).
- **No barrel files.** Import directly from the source file.

## How to Add a Feature

### New API endpoint
1. Pick the right route file in `server/routes/` (or create a new one)
2. Add the route handler
3. If new file: mount it in `server/index.ts`
4. Add corresponding fetch call in the right hook (`useTasks.ts` or `useLists.ts`)

### New UI component
1. Create `client/src/components/MyComponent.tsx`
2. Keep it under 50 lines — extract sub-components if needed
3. Add styles in the matching CSS file (or create a new one + import in globals.css)
4. Wire it in the parent component

### New task field
1. Add column in `server/db.ts` schema
2. Update `client/src/types.ts`
3. Update relevant route in `server/routes/tasks.ts`
4. Update `TaskDetail.tsx` for the edit form
5. Update `TaskItem.tsx` or `utils/format.ts` for display

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, Vite, TypeScript, dnd-kit |
| Backend | Express, better-sqlite3, TypeScript |
| Runtime | Node 20, tsx (dev), Docker (prod) |
| Network | Tailscale sidecar container |

## Commands

```bash
# Dev (needs Node.js installed)
npm install && npm run dev          # backend on :3000
cd client && npm install && npm run dev  # frontend on :5173

# Docker
docker compose up -d                # builds + runs with Tailscale
```

## Database

SQLite at `data/todolist.db`. Two tables:
- **lists**: id, name, color, position, created_at
- **tasks**: id, list_id, parent_id, title, notes, due_date, completed, completed_at, position, recurrence_rule, created_at, updated_at
