# TodoList

Clone de Google Tasks auto-heberge. Tourne sur ton NAS TrueNAS Scale via Docker, accessible de partout grace a Tailscale.

## Fonctionnalites

- Plusieurs listes de taches (travail, perso, courses...)
- Taches avec dates, heures, notes, sous-taches
- Taches recurrentes (jour/semaine/mois/annee + intervalle)
- Taches favorites (etoiles) + vue Starred
- Tri : Mon ordre / Date / Favorites
- Glisser-deposer pour reorganiser
- **Recherche** dans les taches
- **Calendrier** mini-vue avec points sur les jours avec taches
- **Edition inline** : double-clic sur le titre pour editer sur place
- **Multi-selection** : Ctrl+clic pour selectionner, actions groupees (completer/supprimer)
- **Swipe** vers la droite pour completer (mobile)
- **Undo** : toast "Task completed" avec bouton Annuler (5s)
- **Renommer/supprimer** les listes (menu 3 points)
- **Export/Import** JSON depuis la sidebar
- **Mode jour/nuit** : toggle soleil/lune, suit les preferences systeme
- **PWA** : installable comme app sur telephone/PC
- **Auto-refresh** toutes les 30s pour sync multi-appareils
- **Badge onglet** : nombre de taches dans le titre du navigateur
- Interface responsive, dark/light mode
- Accessible en HTTPS depuis n'importe quel appareil Tailscale

---

## Installation sur TrueNAS Scale

### Etape 1 : Installer Tailscale (si pas deja fait)

1. Va sur [tailscale.com](https://tailscale.com) et cree un compte gratuit
2. Installe Tailscale sur ton telephone/PC depuis [tailscale.com/download](https://tailscale.com/download)
3. Connecte-toi sur chaque appareil

### Etape 2 : Generer une cle Tailscale

1. Va sur [login.tailscale.com/admin/settings/keys](https://login.tailscale.com/admin/settings/keys)
2. Clique sur **"Generate auth key"**
3. Coche **"Reusable"** (important !)
4. Copie la cle qui commence par `tskey-auth-...`

### Etape 3 : Installer TodoList sur le NAS

Ouvre le **Shell** de TrueNAS (interface web > System > Shell) et lance :

```bash
curl -fsSL https://raw.githubusercontent.com/amartidandqdq/todolist/master/install.sh | bash
```

Quand le script te demande ta cle Tailscale, colle-la.

L'app sera accessible a : `https://todolist.<ton-tailnet>.ts.net`

### Installation manuelle

```bash
git clone https://github.com/amartidandqdq/todolist.git
cd todolist
bash install.sh
```

### Stockage sur ZFS (recommande)

Le script detecte automatiquement ton pool ZFS et stocke les donnees dans `/mnt/<pool>/apps/todolist/data`. Tu peux aussi le configurer manuellement :

```bash
# Dans .env, change DATA_PATH pour pointer vers ton dataset
DATA_PATH=/mnt/tank/apps/todolist/data
```

### Mises a jour automatiques (optionnel)

Le script propose d'activer Watchtower pour des mises a jour auto toutes les 24h. Tu peux aussi l'activer manuellement :

```bash
cd ~/todolist
docker compose --profile autoupdate up -d watchtower
```

### Limites ressources

Par defaut l'app utilise max ~450MB RAM et 0.75 CPU. Suffisant pour un NAS domestique. Modifiable dans `docker-compose.yml` si besoin.

---

## Utilisation

### Acceder a l'app

- Ouvre `https://todolist.<ton-tailnet>.ts.net` dans ton navigateur
- Sur telephone : ajoute la page en raccourci sur l'ecran d'accueil (c'est une PWA)

### Raccourcis

| Action | Raccourci |
|--------|-----------|
| Nouvelle tache | Tape dans le champ + Entree |
| Editer le titre | Double-clic sur le titre |
| Completer | Clic sur le cercle / Swipe droite (mobile) |
| Favori | Clic sur l'etoile |
| Multi-selection | Ctrl+clic sur plusieurs taches |
| Rechercher | Clic sur la loupe |
| Aide raccourcis | Ctrl+/ |

### Export / Import

Dans la sidebar en bas :
- **Export** : telecharge un fichier JSON avec toutes tes donnees
- **Import** : charge un fichier JSON de sauvegarde

---

## Sauvegardes

```bash
cd ~/todolist
bash backup.sh                              # Sauvegarder
bash backup.sh restore backups/fichier.db   # Restaurer
```

## Mise a jour

```bash
cd ~/todolist
bash update.sh
```

## Depannage

```bash
cd ~/todolist && docker compose logs        # Voir les logs
docker compose ps                           # Verifier les conteneurs
docker compose restart                      # Relancer
```

---

## Pour les curieux

| Composant | Technologie | Role |
|-----------|------------|------|
| Interface | React + TypeScript + dnd-kit | Ce que tu vois dans le navigateur |
| Serveur | Node.js + Express | Gere les requetes et sert l'interface |
| Base de donnees | SQLite (sql.js) | Stocke tes taches (un seul fichier) |
| Conteneur | Docker | Emballe tout pour que ca tourne partout |
| Reseau | Tailscale | Connexion securisee entre tes appareils |

### API pour agents IA

- OpenAPI spec : `GET /api/openapi.yaml`
- CLI : `./cli.sh add "Ma tache" --due 2026-04-10`
- Webhooks : `POST /api/webhooks`
- Batch : `POST/PUT/DELETE /api/tasks/batch`
- Export : `GET /api/export`
- Import : `POST /api/import`
- Plugins : deposer un `.ts` dans `server/plugins/`
