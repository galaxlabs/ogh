#!/usr/bin/env bash
set -e

curl -fsSL https://ollama.com/install.sh | sh
systemctl enable --now ollama || true
systemctl restart ollama || true

ollama pull qwen3:8b || true
ollama pull qwen3:32b || true
ollama pull deepseek-r1:32b || true
ollama pull glm4:9b || true

echo
echo "Local AI stack ready."
echo "Recommended defaults:"
echo "- General model: qwen3:8b"
echo "- Large model: qwen3:32b"
echo "- Reasoning model: deepseek-r1:32b"
echo "- GLM model: glm4:9b"
echo
echo "Note: 32B-class models need a high-memory server. If they fail, keep qwen3:8b as the primary model."
echo "OpenRouter fallback can be enabled for DeepSeek and GLM by setting OPENROUTER_API_KEY in apps/admin-api/.env"
