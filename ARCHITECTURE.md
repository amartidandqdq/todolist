# ARCHITECTURE.md — TodoList Dependency Graph
> Derniere mise a jour : 2026-04-08

## Diagramme de Dependances Inter-Modules

```mermaid
graph TD
    subgraph Client
        App[App.tsx] --> useAppState
        useAppState --> useLists
        useAppState --> useTasks
        useAppState --> useTheme
        useAppState --> useUndoManager
        useLists --> api[utils/api.ts]
        useTasks --> api
        App --> Sidebar
        App --> TaskList
        App --> UndoToast
        TaskList --> TaskItem
        TaskList --> SortableTask
        TaskList --> AddTask
        TaskList --> SearchBar
        TaskList --> CalendarView
        TaskList --> CompletedSection
        Sidebar --> ListMenu
        Sidebar --> ExportImport
    end

    subgraph Server
        index[server/index.ts] --> config[config/env.ts]
        index --> requestId[middleware/requestId]
        index --> errorHandler[middleware/errorHandler]
        index --> routes

        subgraph routes
            lists[routes/lists.ts]
            tasks[routes/tasks.ts]
            subtasks[routes/subtasks.ts]
            batch[routes/batch.ts]
            webhooksR[routes/webhooks.ts]
            health[routes/health.ts]
            exportR[routes/export.ts]
        end

        lists --> db
        tasks --> db
        subtasks --> db
        batch --> db
        webhooksR --> db
        health --> db
        exportR --> db

        lists --> validate[utils/validate.ts]
        tasks --> validate
        tasks --> taskVal[utils/taskValidation.ts]
        subtasks --> taskVal
        batch --> taskVal

        lists --> webhookMw[middleware/withWebhookEmit]
        tasks --> webhookMw
        webhookMw --> emitEvent[utils/webhooks.ts]
        emitEvent --> db

        tasks --> recurrence[utils/recurrence.ts]
        errorHandler --> logger[utils/logger.ts]
        requestId --> logger

        lists --> config
        tasks --> config
        batch --> config

        subgraph db[Database Layer]
            dbIndex[db/index.ts] --> wrapper[db/wrapper.ts]
            dbIndex --> schema[db/schema.ts]
            wrapper --> types[db/types.ts]
            schema --> config
        end
    end

    api -.->|HTTP /api/*| index
```

## Points d'Entree (Entry Points)

| Entry Point | Type | Description |
|-------------|------|-------------|
| `server/index.ts` | HTTP Server | Express app, port configurable via `config.port` |
| `client/src/main.tsx` | React SPA | Vite-bundled, servi en statique par Express |
| `server/plugins/*.ts` | Auto-loaded | Chaque fichier exporte `{ router }`, monte sur `/api/*` |

## Effets de Bord Connus

| Module | Effet de bord | Impact |
|--------|--------------|--------|
| `db/wrapper.ts` | `setInterval(save, config.dbSaveInterval)` | Flush DB toutes les 5s |
| `db/wrapper.ts` | `process.on('SIGINT/SIGTERM', save)` | Graceful shutdown |
| `utils/webhooks.ts` | `fetch()` fire-and-forget | Echecs logues mais non-bloquants |
| `utils/logger.ts` | `fs.appendFileSync` | Ecriture synchrone sur disque |
| `middleware/requestId.ts` | `setTraceId()` | Mutation d'etat global du logger |
| `server/index.ts` | `app.listen()` | Bind port TCP |

## Contrats d'Interface Stables

Ces exports sont utilises par plusieurs modules et ne doivent **pas** etre renommes sans mettre a jour tous les consommateurs :

| Export | Module | Consommateurs |
|--------|--------|---------------|
| `db` (default) | `server/db/index.ts` | 8 route files + webhooks.ts |
| `config` | `server/config/env.ts` | index.ts, wrapper.ts, schema.ts, lists.ts, tasks.ts, batch.ts |
| `createLogger()` | `server/utils/logger.ts` | errorHandler, webhooks, schema, server/index |
| `findTask()` | `server/utils/taskValidation.ts` | tasks.ts, batch.ts, subtasks.ts |
| `nextPosition()` | `server/utils/taskValidation.ts` | tasks.ts, batch.ts, subtasks.ts |
| `withWebhookEmit()` | `server/middleware/withWebhookEmit.ts` | tasks.ts, lists.ts |
| `fetchJSON()` | `client/src/utils/api.ts` | useLists, useTasks, ExportImport, useAppState |
| `useAppState()` | `client/src/hooks/useAppState.ts` | App.tsx |
