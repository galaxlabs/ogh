#!/usr/bin/env bash
set -e

curl -fsSL https://ollama.com/install.sh | sh
systemctl enable --now ollama || true

ollama pull qwen3:8b

echo
echo "Local AI stack ready."
echo "Configured use: Ollama first with qwen3:8b"
echo "OpenRouter fallback can be enabled for DeepSeek and GLM by setting OPENROUTER_API_KEY in apps/admin-api/.env"
