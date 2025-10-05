#!/usr/bin/env bash
# Start the FastAPI uvicorn server for development
set -e
# Activate venv if present
if [ -f .venv/bin/activate ]; then
  # shellcheck disable=SC1091
  . .venv/bin/activate
fi
# Ensure we run from repo root
cd "$(dirname "$0")/.."
# Start uvicorn in background and write logs to /tmp/planthelper_uvicorn.log
.venv/bin/uvicorn server:app --host 127.0.0.1 --port 8000 --log-level info &>/tmp/planthelper_uvicorn.log &
# Wait a moment and print log tail to confirm startup
sleep 0.5
tail -n 50 /tmp/planthelper_uvicorn.log || true
wait
