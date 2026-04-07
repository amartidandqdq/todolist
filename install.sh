#!/bin/bash
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo ""
echo -e "${GREEN}=== TodoList — Installation ===${NC}"
echo ""

# Check Docker
if ! command -v docker &>/dev/null; then
  echo -e "${RED}Docker n'est pas installe.${NC}"
  echo "Sur TrueNAS Scale : active les 'Apps' dans l'interface web."
  echo "Sur TrueNAS Core  : installe Docker dans un jail."
  exit 1
fi

if ! docker compose version &>/dev/null; then
  echo -e "${RED}docker compose n'est pas disponible.${NC}"
  exit 1
fi

# Detect TrueNAS + ZFS pool
INSTALL_DIR="${HOME}/todolist"
DATA_PATH="./data"

if [ -d "/mnt" ]; then
  # Find first ZFS pool
  POOL=$(ls /mnt/ 2>/dev/null | head -1)
  if [ -n "$POOL" ] && [ -d "/mnt/$POOL" ]; then
    TRUENAS_DATA="/mnt/$POOL/apps/todolist/data"
    echo -e "${YELLOW}TrueNAS detecte. Pool: $POOL${NC}"
    echo "Les donnees seront stockees sur ZFS: $TRUENAS_DATA"
    DATA_PATH="$TRUENAS_DATA"
    mkdir -p "$TRUENAS_DATA" 2>/dev/null || true
  fi
fi

if [ -d "$INSTALL_DIR" ] && [ -f "$INSTALL_DIR/docker-compose.yml" ]; then
  echo -e "${YELLOW}TodoList est deja installe dans ${INSTALL_DIR}${NC}"
  read -p "Reinstaller ? (o/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Oo]$ ]]; then
    echo "Installation annulee."
    exit 0
  fi
  cd "$INSTALL_DIR"
  docker compose down 2>/dev/null || true
fi

# Clone or pull
if [ -d "$INSTALL_DIR/.git" ]; then
  echo "Mise a jour du code..."
  cd "$INSTALL_DIR"
  git pull --ff-only
else
  echo "Telechargement de TodoList..."
  git clone https://github.com/amartidandqdq/todolist.git "$INSTALL_DIR"
  cd "$INSTALL_DIR"
fi

# Setup .env
if [ ! -f .env ]; then
  echo ""
  echo -e "${YELLOW}Configuration Tailscale${NC}"
  echo ""
  echo "Tu as besoin d'une cle Tailscale pour que l'app soit accessible."
  echo "Si tu n'en as pas :"
  echo "  https://login.tailscale.com/admin/settings/keys"
  echo "  → Generate auth key → Coche 'Reusable'"
  echo ""
  read -p "Colle ta cle Tailscale (tskey-auth-...): " TS_KEY

  cat > .env <<EOF
TAILSCALE_AUTHKEY=${TS_KEY:-tskey-auth-xxxxx}
TS_HOSTNAME=todolist
PORT=3000
DATA_PATH=${DATA_PATH}
EOF

  if [ -z "$TS_KEY" ]; then
    echo -e "${RED}Pas de cle fournie. Edite .env plus tard.${NC}"
  else
    echo -e "${GREEN}Configuration sauvegardee.${NC}"
  fi
else
  echo -e "${YELLOW}.env existe deja, on garde la config actuelle.${NC}"
fi

# Create dirs
mkdir -p data backups

# Build
echo ""
echo "Construction de l'application..."
echo "(premiere fois = quelques minutes, ensuite < 30s)"
echo ""
docker compose build --quiet

# Start
echo "Demarrage..."
docker compose up -d

# Optional: enable auto-update
echo ""
read -p "Activer les mises a jour automatiques ? (o/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Oo]$ ]]; then
  docker compose --profile autoupdate up -d watchtower
  echo -e "${GREEN}Watchtower active : mises a jour auto toutes les 24h${NC}"
fi

# Wait for health
echo ""
echo -n "Verification"
for i in $(seq 1 20); do
  if curl -fs http://localhost:3000/api/health >/dev/null 2>&1; then
    echo ""
    echo ""
    echo -e "${GREEN}=== TodoList est installe ! ===${NC}"
    echo ""
    echo "Accede a ton app :"
    echo -e "  ${GREEN}https://todolist.<ton-tailnet>.ts.net${NC}"
    echo ""
    if [ "$DATA_PATH" != "./data" ]; then
      echo "Donnees stockees sur ZFS : $DATA_PATH"
    fi
    echo ""
    echo "Commandes utiles :"
    echo "  Logs        : cd ~/todolist && docker compose logs -f"
    echo "  Restart     : cd ~/todolist && docker compose restart"
    echo "  Backup      : cd ~/todolist && bash backup.sh"
    echo "  Update      : cd ~/todolist && bash update.sh"
    echo "  Status      : curl http://localhost:3000/api/health"
    echo ""
    exit 0
  fi
  echo -n "."
  sleep 2
done

echo ""
echo -e "${YELLOW}L'app met du temps a demarrer.${NC}"
echo "  cd ~/todolist && docker compose logs"
