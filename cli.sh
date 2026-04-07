#!/bin/bash
# TodoList CLI — for agents and humans
# Usage: ./cli.sh <command> [args]
#
# Commands:
#   lists                          List all task lists
#   tasks [list_id]                List tasks (optional: filter by list)
#   add <title> [--list ID] [--due DATE] [--recur daily|weekly|monthly]
#   done <task_id>                 Toggle completion
#   edit <task_id> <field> <value> Update a task field (title, notes, due_date)
#   rm <task_id>                   Delete a task
#   sub <task_id> <title>          Add a subtask
#   batch-add <title1> <title2>... Create multiple tasks
#   webhook-add <url> <events>     Register a webhook
#   webhooks                       List webhooks
#   health                         Health check

BASE="${TODOLIST_URL:-http://localhost:3000}/api"

case "$1" in
  lists)
    curl -s "$BASE/lists" | python3 -m json.tool 2>/dev/null || curl -s "$BASE/lists"
    ;;
  tasks)
    URL="$BASE/tasks"
    [ -n "$2" ] && URL="$URL?list_id=$2"
    curl -s "$URL" | python3 -m json.tool 2>/dev/null || curl -s "$URL"
    ;;
  add)
    shift
    TITLE="$1"; shift
    LIST_ID=1; DUE=""; RECUR=""
    while [[ $# -gt 0 ]]; do
      case "$1" in
        --list) LIST_ID="$2"; shift 2 ;;
        --due) DUE="$2"; shift 2 ;;
        --recur) RECUR="{\"freq\":\"$2\",\"interval\":1}"; shift 2 ;;
        *) shift ;;
      esac
    done
    BODY="{\"title\":\"$TITLE\",\"list_id\":$LIST_ID"
    [ -n "$DUE" ] && BODY="$BODY,\"due_date\":\"$DUE\""
    [ -n "$RECUR" ] && BODY="$BODY,\"recurrence_rule\":\"$(echo $RECUR | sed 's/"/\\"/g')\""
    BODY="$BODY}"
    curl -s -X POST "$BASE/tasks" -H 'Content-Type: application/json' -d "$BODY"
    echo
    ;;
  done)
    curl -s -X PUT "$BASE/tasks/$2/complete"
    echo
    ;;
  edit)
    curl -s -X PUT "$BASE/tasks/$2" -H 'Content-Type: application/json' -d "{\"$3\":\"$4\"}"
    echo
    ;;
  rm)
    curl -s -X DELETE "$BASE/tasks/$2"
    echo "Deleted task $2"
    ;;
  sub)
    curl -s -X POST "$BASE/tasks/$2/subtasks" -H 'Content-Type: application/json' -d "{\"title\":\"$3\"}"
    echo
    ;;
  batch-add)
    shift
    TASKS="["
    FIRST=true
    for T in "$@"; do
      $FIRST || TASKS="$TASKS,"
      TASKS="$TASKS{\"title\":\"$T\"}"
      FIRST=false
    done
    TASKS="$TASKS]"
    curl -s -X POST "$BASE/tasks/batch" -H 'Content-Type: application/json' -d "{\"tasks\":$TASKS}"
    echo
    ;;
  webhook-add)
    curl -s -X POST "$BASE/webhooks" -H 'Content-Type: application/json' \
      -d "{\"url\":\"$2\",\"events\":$3}"
    echo
    ;;
  webhooks)
    curl -s "$BASE/webhooks" | python3 -m json.tool 2>/dev/null || curl -s "$BASE/webhooks"
    ;;
  health)
    curl -s "$BASE/health" | python3 -m json.tool 2>/dev/null || curl -s "$BASE/health"
    ;;
  *)
    head -14 "$0" | tail -13
    ;;
esac
