#!/bin/bash
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

cd "$(dirname "$0")"
mkdir -p backups

# Resolve data path from .env or default
DATA_PATH="./data"
if [ -f .env ]; then
  ENVPATH=$(grep DATA_PATH .env 2>/dev/null | cut -d= -f2)
  [ -n "$ENVPATH" ] && DATA_PATH="$ENVPATH"
fi

DB_FILE="$DATA_PATH/todolist.db"
DATE=$(date +%Y-%m-%d_%H%M%S)

# Restore mode
if [ "$1" = "restore" ] && [ -n "$2" ]; then
  if [ ! -f "$2" ]; then
    echo -e "${RED}File not found: $2${NC}"
    exit 1
  fi
  echo -e "${YELLOW}Restoring from $2...${NC}"
  docker compose stop app 2>/dev/null || true
  cp "$2" "$DB_FILE"
  docker compose start app 2>/dev/null || true
  echo -e "${GREEN}Restored.${NC}"
  exit 0
fi

# Backup mode
if [ ! -f "$DB_FILE" ]; then
  echo -e "${YELLOW}No database to backup.${NC}"
  exit 0
fi

BACKUP="backups/todolist-${DATE}.db"
cp "$DB_FILE" "$BACKUP"
echo -e "${GREEN}Backup: ${BACKUP} ($(du -h "$BACKUP" | cut -f1))${NC}"

# Keep last 10
ls -t backups/todolist-*.db 2>/dev/null | tail -n +11 | xargs -r rm --
TOTAL=$(ls backups/todolist-*.db 2>/dev/null | wc -l)
echo "Kept: ${TOTAL}/10 backups"
