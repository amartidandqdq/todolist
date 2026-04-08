# AUDIT.md — TodoList Codebase Audit
> Date: 2026-04-08 | Auditor: Claude SRE

## File Size Analysis (seuil: 150 lignes)

| Fichier | Lignes | Statut |
|---------|--------|--------|
| client/src/components/TaskList.tsx | 137 | OK (sous seuil) |
| client/src/hooks/useAppState.ts | 136 | OK (sous seuil) |
| server/routes/tasks.ts | 129 | OK (sous seuil) |
| client/src/components/TaskDetail.tsx | 112 | OK |
| Tous les autres | <100 | OK |

**Verdict : Aucun fichier ne dépasse 150 lignes. Pas de scission requise.**

## Problemes par Priorite

### Bloquant

| # | Probleme | Fichiers | Impact |
|---|----------|----------|--------|
| B1 | Aucune validation d'input sur POST/PUT | routes/tasks.ts, lists.ts, batch.ts | Crash serveur sur données malformées |
| B2 | Aucun test (zero coverage) | — | Régressions silencieuses impossibles à détecter |

### Majeur

| # | Probleme | Fichiers | Impact |
|---|----------|----------|--------|
| M1 | 11 valeurs hardcodées hors config | server/index.ts, wrapper.ts, schema.ts, lists.ts, logger.ts | Impossible de reconfigurer sans modifier le code |
| M2 | Logger en texte plat (pas JSON-lines) | utils/logger.ts | Parsing automatisé difficile |
| M3 | Pas de traceId par requête | — | Impossible de corréler logs d'une même requête |
| M4 | Pas de ARCHITECTURE.md | — | Pas de vue d'ensemble des dépendances |

### Mineur

| # | Probleme | Fichiers | Impact |
|---|----------|----------|--------|
| m1 | Couplage fort: db singleton importé par 8 modules | routes/*, utils/webhooks.ts | Testabilité réduite |
| m2 | Plugin system sans contrat TypeScript | server/index.ts:52 | Erreurs silencieuses au chargement |
| m3 | Client-side timeouts hardcodés (30s refresh, 5s undo) | useAppState.ts, UndoToast.tsx | Non-configurable |

## Valeurs Hardcodees Identifiees

| Valeur | Fichier | Ligne | Variable cible |
|--------|---------|-------|----------------|
| `3000` | server/index.ts | 19 | `PORT` |
| `'1mb'` | server/index.ts | 23 | `JSON_LIMIT` |
| `'1d'` | server/index.ts | 61 | `STATIC_MAX_AGE` |
| `5000` (ms) | server/db/wrapper.ts | 26 | `DB_SAVE_INTERVAL` |
| `'#4285f4'` | server/db/schema.ts | 8 | `DEFAULT_LIST_COLOR` |
| `'#4285f4'` | server/routes/lists.ts | 21 | `DEFAULT_LIST_COLOR` |
| `5 * 1024 * 1024` | server/utils/logger.ts | 13 | `LOG_MAX_SIZE` |
| `1` (default list) | server/routes/tasks.ts | 33 | `DEFAULT_LIST_ID` |
| `30000` (ms) | client/src/hooks/useAppState.ts | 34 | client-only |
| `5000` (ms) | client/src/components/UndoToast.tsx | 11 | client-only |
| `50` (ms) | client/src/components/SearchBar.tsx | 14 | client-only |

## Plan de Migration

- Phase 1 : Fondations (logger JSON-lines, config/env.ts, requestId middleware)
- Phase 2 : Validation des inputs (validate.ts, wiring routes)
- Phase 3 : Gouvernance (CLAUDE.md refonte, ARCHITECTURE.md)
- Phase 4 : Tests (integration tests, npm run check)
- Phase 5 : Vérification finale
