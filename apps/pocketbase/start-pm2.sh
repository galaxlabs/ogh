#!/usr/bin/env bash
set -a
. /home/fg/ogh/.env
set +a
cd /home/fg/ogh/apps/pocketbase
exec ./pocketbase serve --http=0.0.0.0:8090 --encryptionEnv=PB_ENCRYPTION_KEY --dir=./pb_data_dev --migrationsDir=./pb_migrations --hooksDir=./pb_hooks --hooksWatch=false
