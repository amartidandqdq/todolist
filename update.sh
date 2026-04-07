#!/bin/bash
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

cd "$(dirname "$0")"

echo ""
echo -e "${GREEN}=== TodoList — Mise a jour ===${NC}"
echo ""

# Backup before update
if [ -f backup.sh ]; then
  echo "Sauvegarde avant mise a jour..."
  bash backup.sh
fi

echo "Telechargement de la derniere version..."
git pull --ff-only

echo "Reconstruction de l'application..."
docker compose build --quiet

echo "Redemarrage..."
docker compose down
docker compose up -d

echo ""
echo -e "${GREEN}Mise a jour terminee !${NC}"
echo ""
