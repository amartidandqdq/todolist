#!/bin/bash
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

cd "$(dirname "$0")"
mkdir -p backups

DB_FILE="data/todolist.db"
DATE=$(date +%Y-%m-%d_%H%M%S)

# Restore mode
if [ "$1" = "restore" ] && [ -n "$2" ]; then
  if [ ! -f "$2" ]; then
    echo -e "${RED}Fichier introuvable : $2${NC}"
    exit 1
  fi
  echo -e "${YELLOW}Restauration depuis $2...${NC}"
  docker compose stop app 2>/dev/null || true
  cp "$2" "$DB_FILE"
  docker compose start app 2>/dev/null || true
  echo -e "${GREEN}Restauration terminee.${NC}"
  exit 0
fi

# Backup mode
if [ ! -f "$DB_FILE" ]; then
  echo -e "${YELLOW}Pas de base de donnees a sauvegarder.${NC}"
  exit 0
fi

BACKUP="backups/todolist-${DATE}.db"
cp "$DB_FILE" "$BACKUP"

echo -e "${GREEN}Sauvegarde creee : ${BACKUP}${NC}"

# Keep only last 10 backups
ls -t backups/todolist-*.db 2>/dev/null | tail -n +11 | xargs -r rm --
TOTAL=$(ls backups/todolist-*.db 2>/dev/null | wc -l)
echo "Sauvegardes conservees : ${TOTAL}/10"
