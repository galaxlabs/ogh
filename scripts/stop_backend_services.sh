#!/bin/sh
set -e
ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
RUNTIME_DIR="$ROOT/.runtime"

for name in admin-api pocketbase; do
  PID_FILE="$RUNTIME_DIR/$name.pid"
  if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if kill -0 "$PID" 2>/dev/null; then
      kill "$PID" || true
    fi
    rm -f "$PID_FILE"
  fi
done

fuser -k 3100/tcp 2>/dev/null || true
fuser -k 8090/tcp 2>/dev/null || true

echo "Backend services stopped."
