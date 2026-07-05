

View our: https://https://mergelens-production.up.railway.app/

## Run Locally

**Prerequisites:**  Node.js 18+

1. Install dependencies:
   `npm install`
2. Copy `.env.example` to `.env` and set `GEMINI_API_KEY` (optional — the app
   falls back to a local heuristic analyzer if it's left blank) and
   `GITHUB_TOKEN` (optional — avoids GitHub API rate-limit 403s).
3. Run the app:
   `npm run dev`
4. Open http://localhost:3000

To build and run in production mode:
```bash
npm run build
npm start
```

## Note on `backend/`

The `backend/` folder contains a separate, standalone FastAPI service (Postgres +
Qdrant + Gemini) that is **not currently used by this frontend** — the app above
talks directly to the GitHub API and Gemini from the Express server in
`server.ts` / `server/analysisService.ts`. If you want to run the FastAPI
backend on its own, see `backend/README.md`; a `backend/docker-compose.yml`
is included to spin up its Postgres and Qdrant dependencies.

