#!/bin/sh
set -e
ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
RUNTIME_DIR="$ROOT/.runtime"

for name in admin-api pocketbase; do
  PID_FILE="$RUNTIME_DIR/$name.pid"
  if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
    echo "$name: running (pid $(cat "$PID_FILE"))"
  else
    echo "$name: stopped"
  fi
done

curl -s http://127.0.0.1:3100/health || true
