#!/usr/bin/env bash
# Start the Next.js dev server (idempotent). Used by Cloud Agent `start`.
set -euo pipefail
cd "$(dirname "$0")/.."

export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  # shellcheck disable=SC1090
  . "$NVM_DIR/nvm.sh"
  nvm use 20 >/dev/null 2>&1 || nvm use --lts >/dev/null 2>&1 || true
fi

if [ ! -d node_modules ]; then
  echo "node_modules missing — run install first (npm ci)"
  exit 1
fi

if [ ! -f .env.local ] && [ -f .env.example ]; then
  echo "Warning: .env.local missing. Copy .env.example and set Supabase keys."
fi

# Reuse existing listener on 3000 if healthy
if curl -sf -o /dev/null -m 2 http://127.0.0.1:3000/; then
  echo "Dev server already responding on :3000"
  exec sleep infinity
fi

exec npm run dev
