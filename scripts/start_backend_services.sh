#!/bin/sh
set -e

ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
RUNTIME_DIR="$ROOT/.runtime"
mkdir -p "$RUNTIME_DIR"

fuser -k 3100/tcp 2>/dev/null || true
fuser -k 8090/tcp 2>/dev/null || true

if [ -f "$ROOT/.env" ]; then
  set -a
  . "$ROOT/.env"
  set +a
fi

if [ -f "$ROOT/apps/admin-api/.env" ]; then
  set -a
  . "$ROOT/apps/admin-api/.env"
  set +a
fi

if [ ! -f "$RUNTIME_DIR/admin-api.pid" ] || ! kill -0 "$(cat "$RUNTIME_DIR/admin-api.pid")" 2>/dev/null; then
  nohup sh -c "cd '$ROOT/apps/admin-api' && node server.js" > "$RUNTIME_DIR/admin-api.log" 2>&1 &
  echo $! > "$RUNTIME_DIR/admin-api.pid"
fi

if [ ! -f "$RUNTIME_DIR/pocketbase.pid" ] || ! kill -0 "$(cat "$RUNTIME_DIR/pocketbase.pid")" 2>/dev/null; then
  nohup sh -c "cd '$ROOT/apps/pocketbase' && chmod +x ./pocketbase && ./pocketbase serve --http=0.0.0.0:8090 --encryptionEnv=PB_ENCRYPTION_KEY --dir=./pb_data_dev --migrationsDir=./pb_migrations --hooksDir=./pb_hooks --hooksWatch=false" > "$RUNTIME_DIR/pocketbase.log" 2>&1 &
  echo $! > "$RUNTIME_DIR/pocketbase.pid"
fi

echo "Backend services started."
echo "Admin API: http://127.0.0.1:3100/health"
echo "PocketBase: http://127.0.0.1:8090/_/"
