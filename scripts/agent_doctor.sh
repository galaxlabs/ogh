#!/usr/bin/env bash
set -u

ROOT="/home/fg/ogh"

printf '\n== OpenGuideHub Doctor ==\n'
printf 'Time: %s\n' "$(date -Iseconds)"

printf '\n-- PM2 --\n'
(pm2 list 2>/dev/null || echo 'PM2 not available')

printf '\n-- Admin API health --\n'
(curl -s http://127.0.0.1:3100/health || echo 'Admin API unreachable')

printf '\n\n-- PocketBase dashboard --\n'
(curl -I --max-time 5 http://127.0.0.1:8090/_/ 2>/dev/null | head || echo 'PocketBase unreachable')

printf '\n-- Public site --\n'
(curl -I --max-time 10 https://openguidehub.org 2>/dev/null | head || echo 'Public site unreachable')

printf '\n-- Ollama --\n'
(command -v ollama >/dev/null 2>&1 && echo 'ollama: installed' || echo 'ollama: missing')
(systemctl is-active ollama 2>/dev/null || true)
(curl -s http://127.0.0.1:11434/api/tags 2>/dev/null || echo 'No local models detected')

printf '\n-- Notes --\n'
printf '%s\n' 'Website admin dashboard uses the Admin API credentials.'
printf '%s\n' 'PocketBase superuser uses PB_SUPERUSER_EMAIL and PB_SUPERUSER_PASSWORD.'
printf '%s\n' 'If website admin login fails, check DNS, SSL, and reverse proxy for api/admin/health subdomains.'
