#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
VENV_DIR="$BACKEND_DIR/.venv"
BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
  local exit_code=$?
  trap - EXIT INT TERM
  if [[ -n "$FRONTEND_PID" ]]; then
    kill "$FRONTEND_PID" 2>/dev/null || true
  fi
  if [[ -n "$BACKEND_PID" ]]; then
    kill "$BACKEND_PID" 2>/dev/null || true
  fi
  if [[ -n "$FRONTEND_PID" ]]; then
    wait "$FRONTEND_PID" 2>/dev/null || true
  fi
  if [[ -n "$BACKEND_PID" ]]; then
    wait "$BACKEND_PID" 2>/dev/null || true
  fi
  exit "$exit_code"
}
trap cleanup EXIT INT TERM

for program in python3 node npm curl; do
  if ! command -v "$program" >/dev/null 2>&1; then
    echo "Missing prerequisite: $program"
    echo "Install Python 3.11+, Node.js 22+ (which includes npm), and make sure they are on PATH."
    exit 1
  fi
done

if [[ ! -f "$BACKEND_DIR/.env" ]]; then
  cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
  echo "Created backend/.env from the example. Add API keys there when you need AI integrations."
fi

if [[ ! -f "$FRONTEND_DIR/.env.local" ]]; then
  cp "$FRONTEND_DIR/.env.example" "$FRONTEND_DIR/.env.local"
  echo "Created frontend/.env.local with the local API URL."
fi

if [[ ! -x "$VENV_DIR/bin/python" ]]; then
  echo "Creating the backend virtual environment..."
  python3 -m venv "$VENV_DIR"
fi

BACKEND_MARKER="$VENV_DIR/.insightflow-requirements-installed"
if [[ ! -f "$BACKEND_MARKER" || "$BACKEND_DIR/requirements.txt" -nt "$BACKEND_MARKER" ]]; then
  echo "Installing backend dependencies..."
  "$VENV_DIR/bin/python" -m pip install --upgrade pip
  "$VENV_DIR/bin/python" -m pip install -r "$BACKEND_DIR/requirements.txt"
  touch "$BACKEND_MARKER"
fi

FRONTEND_MARKER="$FRONTEND_DIR/node_modules/.insightflow-dependencies-installed"
if [[ ! -d "$FRONTEND_DIR/node_modules" || ! -f "$FRONTEND_MARKER" || "$FRONTEND_DIR/package.json" -nt "$FRONTEND_MARKER" || "$FRONTEND_DIR/package-lock.json" -nt "$FRONTEND_MARKER" ]]; then
  echo "Installing frontend dependencies..."
  (cd "$FRONTEND_DIR" && npm ci)
  touch "$FRONTEND_MARKER"
fi

echo
echo "Starting the InsightFlow API on http://127.0.0.1:8000 ..."
(
  cd "$BACKEND_DIR"
  exec "$VENV_DIR/bin/uvicorn" main:app --reload --host 127.0.0.1 --port 8000
) &
BACKEND_PID=$!

echo "Waiting for the API health check..."
backend_ready=0
for attempt in {1..40}; do
  if curl --silent --show-error --fail http://127.0.0.1:8000/health >/dev/null 2>&1; then
    backend_ready=1
    break
  fi
  if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
    echo "The backend process exited before becoming healthy. Read the backend error above."
    exit 1
  fi
  sleep 0.5
done

if [[ "$backend_ready" -ne 1 ]]; then
  echo "The backend did not become healthy within 20 seconds."
  echo "Check backend/.env and the error messages above."
  exit 1
fi

echo
echo "Starting the InsightFlow frontend ..."
(
  cd "$FRONTEND_DIR"
  exec npm run dev -- --host 127.0.0.1
) &
FRONTEND_PID=$!

echo
echo "InsightFlow is starting."
echo "Frontend:       http://localhost:5173 (use the Vite URL printed below)"
echo "Backend health: http://127.0.0.1:8000/health"
echo "API docs:       http://127.0.0.1:8000/docs"
echo
if ! grep -Eq '^GEMINI_API_KEY=.+$' "$BACKEND_DIR/.env"; then
  echo "Note: GEMINI_API_KEY is not configured; Gemini-powered comment analysis will not work until you add it to backend/.env."
fi
if ! grep -Eq '^ADAPTION_API_KEY=.+$' "$BACKEND_DIR/.env"; then
  echo "Note: ADAPTION_API_KEY is not configured; Adaption operations will remain unavailable until you add it to backend/.env."
fi
echo "Keep this terminal open. Press Ctrl+C to stop both services."

wait "$FRONTEND_PID"
