# TodoList

Clone de Google Tasks auto-heberge. Tourne sur ton NAS TrueNAS via Docker, accessible de partout via Tailscale.

## Fonctionnalites

- Plusieurs listes de taches (travail, perso, courses...)
- Taches avec dates, heures, notes, sous-taches
- Taches recurrentes (jour/semaine/mois/annee + intervalle)
- Taches favorites (etoiles) + vue Starred
- Tri : Mon ordre / Date / Favorites
- Glisser-deposer pour reorganiser
- Recherche dans les taches
- Calendrier mini-vue avec points sur les jours avec taches
- Edition inline : double-clic sur le titre pour editer sur place
- Multi-selection : Ctrl+clic pour selectionner, actions groupees
- Swipe vers la droite pour completer (mobile)
- Undo : toast avec bouton Annuler (5s)
- Renommer/supprimer les listes (menu 3 points)
- Export/Import JSON depuis la sidebar
- Mode jour/nuit : toggle soleil/lune + preferences systeme
- PWA : installable comme app sur telephone/PC
- Auto-refresh toutes les 30s pour sync multi-appareils
- Badge onglet : nombre de taches dans le titre du navigateur
- Interface responsive
- Accessible en HTTPS via Tailscale

---

## Installation sur TrueNAS

### Etape 1 : Installer Tailscale

1. Cree un compte gratuit sur [tailscale.com](https://tailscale.com)
2. Installe Tailscale sur tes appareils depuis [tailscale.com/download](https://tailscale.com/download)

### Etape 2 : Generer une cle Tailscale

1. Va sur [login.tailscale.com/admin/settings/keys](https://login.tailscale.com/admin/settings/keys)
2. Clique **"Generate auth key"** → coche **"Reusable"**
3. Copie la cle `tskey-auth-...`

### Etape 3 : Installer TodoList

Ouvre le **Shell** TrueNAS (interface web > System > Shell) :

```bash
curl -fsSL https://raw.githubusercontent.com/amartidandqdq/todolist/master/install.sh | bash
```

Colle ta cle Tailscale quand demande. Accessible a : `https://todolist.<ton-tailnet>.ts.net`

### Installation manuelle

```bash
git clone https://github.com/amartidandqdq/todolist.git
cd todolist && bash install.sh
```

### Stockage ZFS

Le script detecte automatiquement ton pool ZFS. Configurable dans `.env` :

```bash
DATA_PATH=/mnt/tank/apps/todolist/data
```

### Mises a jour automatiques

```bash
cd ~/todolist
docker compose --profile autoupdate up -d watchtower
```

### Ressources

~450MB RAM max, 0.75 CPU. Modifiable dans `docker-compose.yml`.

---

## Utilisation

### Raccourcis

| Action | Raccourci |
|--------|-----------|
| Nouvelle tache | Champ + Entree |
| Editer titre | Double-clic |
| Completer | Cercle / Swipe droite (mobile) |
| Favori | Etoile |
| Multi-selection | Ctrl+clic |
| Rechercher | Loupe |
| Aide | Ctrl+/ |

### Export / Import

Sidebar en bas : boutons Export (JSON) et Import.

---

## Maintenance

```bash
cd ~/todolist
bash backup.sh                              # Sauvegarder
bash backup.sh restore backups/fichier.db   # Restaurer
bash update.sh                              # Mettre a jour
docker compose logs                         # Logs
docker compose restart                      # Relancer
```

---

## Architecture

```
server/
  index.ts                   Express app entry, barrel imports
  db/
    types.ts                 DatabaseAdapter interface (DI-ready)
    wrapper.ts               sql.js adapter (better-sqlite3 API)
    schema.ts                Tables, indexes, migrations
    index.ts                 Barrel: singleton + schema init
  routes/
    index.ts                 Barrel: all 7 routers
    lists.ts                 CRUD listes
    tasks.ts                 CRUD taches + star/complete/indent
    subtasks.ts              CRUD sous-taches
    batch.ts                 Operations en lot
    webhooks.ts              Abonnements webhook
    health.ts                Health check
    export.ts                Export/import JSON
  utils/
    index.ts                 Barrel: recurrence + webhooks
    recurrence.ts            Calcul prochaine date recurrente
    webhooks.ts              Dispatch events aux subscribers
  plugins/                   Auto-loaded .ts files
  middleware/                Reserved

client/src/
  types.ts                   Task, TaskList, SortMode, ViewMode
  App.tsx                    Root: state, undo, search, refresh
  utils/
    index.ts                 Barrel
    api.ts                   fetchJSON(), ApiError
    format.ts                formatDate(), recurrenceLabel()
  hooks/
    index.ts                 Barrel
    useLists.ts              CRUD listes
    useTasks.ts              CRUD taches (filter/sort/search)
    useTheme.ts              Light/dark/system
  components/
    index.ts                 Barrel: 14 composants
    Sidebar.tsx              Nav, theme, export/import
    TaskList.tsx              DnD, sort, search, calendar, batch
    TaskDetail.tsx            Panel edition
    TaskItem.tsx              Ligne tache (memo, inline edit, swipe)
    SortableTask.tsx          Wrapper DnD
    SubtaskList.tsx           Sous-taches (memo)
    SubtaskInput.tsx          Ajout sous-tache
    CompletedSection.tsx      Section completees
    AddTask.tsx               Input rapide (memo)
    SearchBar.tsx             Recherche
    CalendarView.tsx          Mini calendrier
    ListMenu.tsx              Menu 3 points
    ExportImport.tsx          Boutons export/import
    UndoToast.tsx             Toast annulation
  styles/
    globals.css               Importe tout
    variables.css             Tokens light/dark
    base.css                  Reset, body
    sidebar.css               Sidebar, list menu
    layout.css                Zone principale, sort, add task
    task-item.css             Tache, checkbox, etoile, subtasks
    detail.css                Panel detail
    widgets.css               Toast, search, batch, calendrier
    responsive.css            Mobile/tablet
```

### Conventions

- 1 fichier = 1 responsabilite (<50 lignes)
- `index.ts` barrel dans chaque dossier
- JSDoc sur chaque export
- Types dans `types.ts`, jamais dans hooks/composants
- DB adapter decouple via interface `DatabaseAdapter`

---

## API pour agents IA

| Endpoint | Description |
|----------|------------|
| `GET /api/openapi.yaml` | Spec OpenAPI 3.1 complete |
| `GET /api/health` | Status + compteurs |
| `GET /api/export` | Export JSON complet |
| `POST /api/import` | Import backup JSON |
| `POST/PUT/DELETE /api/tasks/batch` | Operations en lot |
| `POST /api/webhooks` | S'abonner aux events |
| `./cli.sh` | CLI shell pour agents terminal |
| `server/plugins/*.ts` | Plugins auto-loaded |

---

## Tech Stack

| Couche | Tech |
|--------|------|
| Frontend | React 18, TypeScript, Vite, dnd-kit |
| Backend | Node.js, Express, sql.js (SQLite pur JS) |
| Infra | Docker, Tailscale, Watchtower |
| Standards | OpenAPI 3.1, PWA, JSDoc |
