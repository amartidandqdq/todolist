# CLAUDE.md — OS du Projet TodoList
> Derniere mise a jour : 2026-04-08

Self-hosted Google Tasks clone. React + Express + SQLite + Docker + Tailscale.

## Glossaire Metier

| Terme canonique | Definition | Synonymes INTERDITS |
|---|---|---|
| Task | Unite de travail avec titre, notes, date, recurrence | todo, item, card |
| List | Conteneur de taches (ex: "My Tasks") | folder, project, board |
| Subtask | Tache enfant (parent_id != null) | child, sub-item |
| Webhook | Abonnement HTTP notifie sur evenements CRUD | callback, listener, subscription |
| Recurrence | Regle de repetition JSON (freq + interval) | repeat, schedule, recurring |

## Regles d'Or (non negociables)

1. **Aucun import circulaire.** Si une logique doit etre partagee, extraire dans un module tiers.
2. **Fichiers < 150 lignes** (hors fichiers de types purs et CSS).
3. **Fonctions pures privilegiees.** Effets de bord isoles dans des modules dedies (db/, middleware/).
4. **Zero valeur hardcodee** en dehors de `server/config/env.ts`. Toute config passe par `config`.
5. **Tout bug corrige = un test de non-regression** dans `tests/repro/`.

## Protocole de Debug (obligatoire)

1. **Lire `logs/diagnostic.log`** — identifier le premier `[ERROR]` ou anomalie. Filtrer par `"module":"<nom>"` (JSON-lines).
2. **Reproduire** dans `tests/repro/[bug-slug].test.ts`.
3. **Corriger** le code source dans le module identifie.
4. **Verifier** que le test passe ET que le log confirme la disparition de l'erreur.
5. **Mettre a jour** ce fichier si le fix modifie l'architecture.

## Carte des Modules

> Voir `ARCHITECTURE.md` pour le diagramme Mermaid complet.

```
server/
  config/
    env.ts                → Config centralisee (process.env + defaults, frozen)
    index.ts              → Barrel
  index.ts                → Express app, mounts routes, requestId + errorHandler
  db/
    index.ts              → Barrel: cree DB singleton, applique schema
    types.ts              → DatabaseAdapter, PreparedStatement, RunResult interfaces
    wrapper.ts            → sql.js → better-sqlite3-compatible adapter (DI-ready)
    schema.ts             → Table DDL, indexes, migrations, seed data
  routes/
    index.ts              → Barrel: re-exports all route handlers
    lists.ts              → GET/POST/PUT/DELETE /api/lists (validation + webhook)
    tasks.ts              → GET/POST/PUT/DELETE /api/tasks + complete/star/reorder/indent
    subtasks.ts           → GET/POST /api/tasks/:id/subtasks
    batch.ts              → POST/PUT/DELETE /api/tasks/batch
    webhooks.ts           → GET/POST/DELETE /api/webhooks
    health.ts             → GET /api/health
    export.ts             → GET /api/export, POST /api/import
  utils/
    index.ts              → Barrel
    logger.ts             → createLogger(module) → JSON-lines + stdout, traceId support
    recurrence.ts         → computeNextDate(due, rule) → next ISO date
    webhooks.ts           → emitEvent(name, payload) → POST (failures logged)
    taskValidation.ts     → findTask(), nextPosition(), validateArray()
    validate.ts           → validateTaskInput(), validateListInput() (zero-dep)
  middleware/
    index.ts              → Barrel
    requestId.ts          → Genere traceId UUID par requete
    withWebhookEmit.ts    → Auto-fire webhooks sur 2xx
    errorHandler.ts       → Catch-all global, log + JSON safe response
  plugins/                → Drop .ts files here, auto-mounted at /api/*

client/src/
  main.tsx                → React entry point
  App.tsx                 → Thin JSX shell, delegates to useAppState()
  types.ts                → Task, TaskList, SortMode, ViewMode (JSDoc'd)
  utils/
    index.ts              → Barrel: API, fetchJSON, formatDate, recurrenceLabel
    api.ts                → fetchJSON<T>(), ApiError class
    format.ts             → formatDate(), recurrenceLabel()
  hooks/
    index.ts              → Barrel
    useLists.ts           → CRUD hook for task lists
    useTasks.ts           → CRUD hook for tasks (filter/sort/search)
    useTheme.ts           → Light/dark/system theme with localStorage
    useUndoManager.ts     → Undo toast state: push(message, rollback), dismiss()
    useAppState.ts        → Centralized state composition (all hooks + effects + handlers)
  components/
    index.ts              → Barrel: all 14 components
    Sidebar.tsx, TaskList.tsx, TaskDetail.tsx, TaskItem.tsx, SortableTask.tsx,
    SubtaskList.tsx, SubtaskInput.tsx, CompletedSection.tsx, AddTask.tsx,
    SearchBar.tsx, CalendarView.tsx, ListMenu.tsx, ExportImport.tsx, UndoToast.tsx
  styles/
    globals.css → variables.css → base.css → sidebar.css → layout.css →
    task-item.css → detail.css → widgets.css → responsive.css
```

## Conventions

- **One file = one responsibility.** Target <50 lines server-side. Split if exceeding 150.
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
2. Add validation in `server/utils/validate.ts` if needed
3. Add `export { default as myRoutes } from './myfeature.js'` to `server/routes/index.ts`
4. Mount in `server/index.ts`: `app.use('/api', myRoutes)`
5. Add to `openapi.yaml`

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

## Logger Usage

```typescript
import { createLogger } from '../utils/logger.js';
const log = createLogger('myModule');

log.info('Started');
log.warn('Slow query', { table: 'tasks', ms: 500 });
log.error('Insert failed', { body: req.body }, err);
log.debug('Verbose');  // only when LOG_LEVEL=debug
```

File format: JSON-lines in `logs/diagnostic.log`. Stdout: human-readable.

## Database

SQLite at `data/todolist.db`. Adapter in `server/db/wrapper.ts`.

| Table | Key columns |
|-------|------------|
| lists | id, name, color, position |
| tasks | id, list_id, parent_id, title, notes, due_date, due_time, completed, starred, position, recurrence_rule |
| webhooks | id, url, events (JSON), secret |

## Commands

```bash
npm run dev                      # Backend :3000 (tsx watch)
cd client && npm run dev         # Frontend :5173 (vite)
npm run check                    # Type-check + tests
docker compose up -d             # Production + Tailscale
curl /api/openapi.yaml           # API spec
```

## Ce que tu NE dois PAS faire

- Modifier `server/config/env.ts` sans mettre a jour `.env.example`
- Refactorer un module sans avoir lu son `index.ts` (barrel)
- Supprimer un log sans justification dans le commit
- Fusionner des fichiers edites par plusieurs agents simultanement
- Briser les interfaces exportees existantes (ajouter = OK, renommer/supprimer = mettre a jour tous les consommateurs d'abord)
- Hardcoder des valeurs en dehors de `config/`
