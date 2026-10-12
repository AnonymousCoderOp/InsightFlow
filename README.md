# InsightFlow

**InsightFlow** is an AI-powered customer-feedback intelligence workspace. It collects feedback, classifies and analyzes customer comments, highlights sentiment and category trends, suggests evidence-based next steps, tracks issues, and supports a human-reviewed dataset workflow for Adaption.

The repository contains a React + TypeScript + Vite frontend and a FastAPI + SQLite backend.

## Features in the current implementation

- Feedback management: add, search, filter, edit, delete, bulk import, and CSV export.
- CSV review: preview imported records and report invalid or duplicate rows.
- Gemini-powered comment analysis: sentiment, category, urgency, topics, rationale, customer impact, evidence quotes, and recommended actions.
- Feedback analytics: sentiment breakdown, category counts, dated trends, and period-over-period analysis.
- Signal Radar: structured findings and recommended actions grounded in feedback records, with a deterministic fallback when AI output is unavailable.
- Decision Center: save recommendations for review.
- Issue Tracker: persist statuses for issues.
- Adaption Model Lab: approve human-reviewed examples, export the reviewed dataset, request an upload estimate, and track supported optimization operations.

Some cards are intentionally illustrative, and integrations that require API credentials are not available until configured. The interface should not be treated as proof that a remote AI operation has run.

## Run locally on macOS

### Prerequisites

Install:
- Python 3.11 or newer
- Node.js 22 or newer (npm is included with Node.js)

Check that they're installed:

```bash
python3 --version
node --version
npm --version
```

Each command prints the installed version of the corresponding tool.

### Easiest option: start both services together

From the repository root, run:

```bash
bash start-local.sh
```

The script creates a Python virtual environment if needed, installs backend and frontend dependencies, creates local environment files from the examples if they don't exist, starts both services, and checks backend health. It does not overwrite existing environment files.

When it is ready, open the URL printed by Vite, normally:

- Frontend: http://localhost:5173
- Backend health: http://127.0.0.1:8000/health
- Interactive API docs: http://127.0.0.1:8000/docs

Keep the terminal running while using the app. Press **Ctrl+C** to stop the local services.

### Manual setup

Open two terminal windows from the repository root.

**Terminal 1 — backend**

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

If `.env` already exists, do not run the `cp` command again: it would overwrite your local configuration. Instead, edit the existing file.

**Terminal 2 — frontend**

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

If `.env.local` already exists, keep it and verify its API URL instead of copying over it.

## Environment variables

### Backend: `backend/.env`

Use `backend/.env.example` as a template:

- `GEMINI_API_KEY`: optional for basic local data management; required for Gemini-powered individual feedback analysis and AI trend explanations.
- `GEMINI_MODEL`: Gemini model name. The example defaults to `gemini-3.8-flash`.
- `FRONTEND_URL`: browser origin allowed by backend CORS. For local development, use `http://localhost:5173`.
- `ADAPTION_API_KEY`: optional; required only for operations that call Adaption.
- `INSIGHTFLOW_DATABASE_PATH`: optional SQLite file path. If omitted, the app stores its local database at `backend/insightflow.db`.

Never commit `.env` files or API keys. The repository's `.gitignore` excludes local environment files and database files.

### Frontend: `frontend/.env.local`

The frontend reads `VITE_API_BASE_URL`. For local use, set:

```dotenv
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Vite exposes `VITE_*` values to browser code, so this variable must contain only a public API URL, never a secret or API key. Restart Vite after changing environment variables.

## Verify the app

1. Open http://127.0.0.1:8000/health. A healthy response should include `"status":"ok"` and `"database":"connected"`.
2. Open http://127.0.0.1:8000/docs and check the available API endpoints.
3. Open the Vite URL, add a feedback comment, and confirm it appears in the list.
4. Refresh the page and confirm the comment is still present.
5. Configure `GEMINI_API_KEY` in `backend/.env` and restart the backend before testing live AI analysis.
6. Configure `ADAPTION_API_KEY` only if you want to test the Adaption workflow.

The backend seeds sample feedback and issue records into a new empty database so the dashboard has data to display. This is demo data, not real customer information.

## Tests

Install the development dependencies and run the backend tests:

```bash
pip install -r backend/requirements-dev.txt
python -m pytest backend/tests
```

Build the frontend:

```bash
cd frontend
npm ci
npm run build
```

## Project structure

```text
InsightFlow/
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   ├── requirements-dev.txt
│   └── tests/
├── frontend/
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
├── .github/workflows/ci.yml
├── start-local.sh
└── README.md
```

## Known boundaries

- Authentication and multi-user workspace management are not currently implemented.
- Individual AI analysis requires a valid Gemini API key and access to the configured model.
- Adaption operations require a valid Adaption API key and account permissions. Dataset preparation and status handling do not by themselves mean a model has been trained or deployed.
- SQLite is suitable for local development. Before using a hosting environment, confirm that its filesystem persists database files or configure a persistent database path/storage.
- A successful frontend build does not verify external API credentials or remote integration availability.
