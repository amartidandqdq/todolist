# TodoList

Clone de Google Tasks auto-heberge. Tourne sur ton NAS TrueNAS Scale via Docker, accessible de partout grace a Tailscale.

## Ce que ca fait

- Creer plusieurs listes de taches (travail, perso, courses...)
- Taches avec dates, notes, sous-taches
- Taches recurrentes (tous les jours, semaines, mois)
- Glisser-deposer pour reorganiser
- Interface sombre, responsive (marche sur telephone)
- Accessible en HTTPS depuis n'importe quel appareil sur ton reseau Tailscale

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

C'est tout ! L'app sera accessible a :

```
https://todolist.<ton-tailnet>.ts.net
```

(Tu peux trouver le nom de ton tailnet dans l'admin Tailscale)

### Installation manuelle (alternative)

```bash
# Clone le projet
git clone https://github.com/amartidandqdq/todolist.git
cd todolist

# Lance l'installateur
bash install.sh
```

---

## Utilisation

### Acceder a l'app

Depuis n'importe quel appareil connecte a ton Tailscale :
- Ouvre `https://todolist.<ton-tailnet>.ts.net` dans ton navigateur
- Sur telephone : ajoute la page en raccourci sur l'ecran d'accueil

### Gerer les taches

- **Ajouter une tache** : tape dans le champ en haut et appuie sur Entree
- **Cocher une tache** : clique sur le rond a gauche
- **Modifier une tache** : clique sur le texte de la tache (panneau a droite)
- **Ajouter une sous-tache** : clique "+ Add subtask" sous une tache
- **Reorganiser** : glisse-depose les taches
- **Creer une liste** : clique "+ New list" dans la barre laterale

### Taches recurrentes

1. Clique sur une tache pour ouvrir le panneau de detail
2. Choisis la recurrence (Daily, Weekly, Monthly...)
3. Quand tu coches la tache, une nouvelle est automatiquement creee

---

## Sauvegardes

Les donnees sont dans le dossier `data/`. Pour sauvegarder :

```bash
cd ~/todolist
bash backup.sh
```

Les sauvegardes sont dans `backups/`. Pour restaurer :

```bash
bash backup.sh restore backups/todolist-2026-04-07.db
```

---

## Mise a jour

```bash
cd ~/todolist
bash update.sh
```

---

## Depannage

### L'app ne demarre pas
```bash
cd ~/todolist
docker compose logs
```

### Je ne peux pas acceder a l'app
- Verifie que Tailscale est actif sur ton appareil
- Verifie que le container tourne : `docker compose ps`
- Relance : `docker compose restart`

### Je veux changer le nom de l'app dans Tailscale
Edite `.env` et change `TS_HOSTNAME=todolist` par le nom voulu, puis :
```bash
docker compose down
docker compose up -d
```

### Je veux tout supprimer
```bash
cd ~/todolist
docker compose down -v
cd .. && rm -rf todolist
```

---

## Pour les curieux

| Composant | Technologie | Role |
|-----------|------------|------|
| Interface | React + TypeScript | Ce que tu vois dans le navigateur |
| Serveur | Node.js + Express | Gere les requetes et sert l'interface |
| Base de donnees | SQLite | Stocke tes taches (un seul fichier) |
| Conteneur | Docker | Emballe tout pour que ca tourne partout |
| Reseau | Tailscale | Connexion securisee entre tes appareils |
