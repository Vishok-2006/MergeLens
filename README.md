<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/847938e8-c90d-4104-a359-18e70980e7dc

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

