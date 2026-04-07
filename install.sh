#!/bin/bash
set -e

# Colors
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
  echo "Sur TrueNAS Scale, Docker est normalement deja disponible."
  echo "Si ce n'est pas le cas, active les 'Apps' dans l'interface TrueNAS."
  exit 1
fi

if ! docker compose version &>/dev/null; then
  echo -e "${RED}docker compose n'est pas disponible.${NC}"
  exit 1
fi

# Install dir
INSTALL_DIR="${HOME}/todolist"

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
  echo "Si tu n'en as pas, va sur :"
  echo "  https://login.tailscale.com/admin/settings/keys"
  echo "et genere une cle 'Reusable'."
  echo ""
  read -p "Colle ta cle Tailscale (tskey-auth-...): " TS_KEY

  if [ -z "$TS_KEY" ]; then
    echo -e "${RED}Pas de cle fournie. Tu peux l'ajouter plus tard dans .env${NC}"
    cp .env.example .env
  else
    cat > .env <<EOF
TAILSCALE_AUTHKEY=${TS_KEY}
TS_HOSTNAME=todolist
PORT=3000
EOF
    echo -e "${GREEN}Configuration sauvegardee.${NC}"
  fi
else
  echo -e "${YELLOW}.env existe deja, on garde la config actuelle.${NC}"
fi

# Create data dir
mkdir -p data backups

# Build and start
echo ""
echo "Construction de l'application (ca peut prendre quelques minutes)..."
echo ""
docker compose build --quiet

echo ""
echo "Demarrage..."
docker compose up -d

# Wait for health
echo ""
echo -n "Verification que tout tourne"
for i in $(seq 1 15); do
  if docker compose ps | grep -q "Up"; then
    echo ""
    echo ""
    echo -e "${GREEN}=== TodoList est installe ! ===${NC}"
    echo ""
    echo "Accede a ton app depuis n'importe quel appareil Tailscale :"
    echo ""
    echo -e "  ${GREEN}https://todolist.<ton-tailnet>.ts.net${NC}"
    echo ""
    echo "Commandes utiles :"
    echo "  Voir les logs     : cd ~/todolist && docker compose logs"
    echo "  Redemarrer        : cd ~/todolist && docker compose restart"
    echo "  Sauvegarder       : cd ~/todolist && bash backup.sh"
    echo "  Mettre a jour     : cd ~/todolist && bash update.sh"
    echo ""
    exit 0
  fi
  echo -n "."
  sleep 2
done

echo ""
echo -e "${YELLOW}L'app met du temps a demarrer. Verifie les logs :${NC}"
echo "  cd ~/todolist && docker compose logs"
