#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$ROOT_DIR/frontend"
BACKEND_DIR="$ROOT_DIR/backend"

command_exists() {
  command -v "$1" > /dev/null 2>&1
}

open_terminal() {
  local title="$1"
  local workdir="$2"
  local command="$3"

  if command_exists konsole; then
    konsole --new-tab --workdir "$workdir" -p tabtitle="$title" -e bash -lc "$command; echo; echo '$title stopped. Press Enter to close...'; read -r" > /dev/null 2>&1 &
  elif command_exists gnome-terminal; then
    gnome-terminal --title="$title" --working-directory="$workdir" -- bash -lc "$command; echo; echo '$title stopped. Press Enter to close...'; read -r" > /dev/null 2>&1 &
  elif command_exists xterm; then
    xterm -T "$title" -e "cd '$workdir' && $command; echo; echo '$title stopped. Press Enter to close...'; read -r" > /dev/null 2>&1 &
  else
    echo "No supported terminal found. Install konsole, gnome-terminal, or xterm."
    exit 1
  fi
}

# ── Qdrant (Docker) check ────────────────────────────────────────────────────
# MySQL runs as a local system service (mysql-server) — not managed here.
# Qdrant is started via a plain docker run (detached, no separate terminal).
if ! command_exists docker; then
  echo "Warning: docker not found. Qdrant must be running manually."
else
  QDRANT_RUNNING=$(docker ps -q -f name=^qdrant$ 2>/dev/null || true)
  QDRANT_EXISTS=$(docker ps -aq -f name=^qdrant$ 2>/dev/null || true)

  if [ -n "$QDRANT_RUNNING" ]; then
    echo "Qdrant container is already running."
  elif [ -n "$QDRANT_EXISTS" ]; then
    echo "Qdrant container exists but is stopped. Starting it..."
    docker start qdrant
    sleep 5
  else
    echo "Qdrant container not found. Creating and starting it..."
    docker run -d \
      --name qdrant \
      -p 6333:6333 \
      -p 6334:6334 \
      -v "$ROOT_DIR/qdrant_storage:/qdrant/storage" \
      qdrant/qdrant:latest
    sleep 8
  fi
fi
# ─────────────────────────────────────────────────────────────────────────────

if ! command_exists java; then
  echo "Java 21 is required but java was not found."
  exit 1
fi

if ! command_exists npm; then
  echo "Node.js/npm is required but npm was not found."
  exit 1
fi

BACKEND_CMD="if [ -f ../.env ]; then set -a && source ../.env && set +a; fi; ./mvnw spring-boot:run || mvn spring-boot:run"
FRONTEND_CMD="if [ -f ../.env ]; then set -a && source ../.env && set +a; fi; if [ ! -d node_modules ]; then npm install; fi; npm run dev -- --host 0.0.0.0"

open_terminal "CodeLens Backend" "$BACKEND_DIR" "$BACKEND_CMD"
open_terminal "CodeLens Frontend" "$FRONTEND_DIR" "$FRONTEND_CMD"

echo "CodeLens is starting in separate terminal tabs/windows."
echo "Frontend: http://localhost:5173"
echo "Backend health: http://localhost:8080/actuator/health"
