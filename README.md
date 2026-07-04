# MergeLens MVP: AI Pull Request Analyzer

Working vertical slice for GitHub PR webhooks, MySQL persistence, Qdrant RAG hooks, NVIDIA NIM primary AI review with Groq fallback, GitHub comment posting, and a React dashboard.

## Architecture

```text
GitHub Webhook -> Spring Boot /webhook/github -> MySQL PR metadata
                                      |-> async processor
                                      |-> GitHub API fetch files/diff
                                      |-> chunk + NVIDIA embeddings -> Qdrant
                                      |-> retrieve top-K relevant chunks
                                      |-> NVIDIA NIM chat, fallback Groq -> JSON comments/scores
                                      |-> MySQL review_comments/review_scores
                                      |-> GitHub PR review comments
React Dashboard -> /api/pull-requests, /api/pull-requests/{id}
```

## Setup

```bash
cp .env.example .env
# fill NVIDIA_API_KEY, NVIDIA_EMBEDDING_MODEL, optionally GITHUB_TOKEN and GITHUB_WEBHOOK_SECRET
docker compose up --build
```

Dashboard: http://localhost:5173  
Backend: http://localhost:8080  
Qdrant Dashboard: http://localhost:6333/dashboard

## Mock webhook demo

```bash
curl -i -X POST http://localhost:8080/webhook/github \
  -H 'Content-Type: application/json' \
  -H 'X-GitHub-Event: pull_request' \
  --data @mock-webhook.json
```

The webhook returns `accepted` immediately and processing continues asynchronously. If AI keys, Qdrant, or GitHub posting are unavailable, the pipeline logs failures and still persists default scores where possible.

## Implemented scope

- Spring Boot webhook receiver `/webhook/github`
- MySQL tables: `repositories`, `pull_requests`, `review_comments`, `review_scores` via JPA
- GitHub REST client for changed files, diff fetch, and PR comments
- RAG chunking plus Qdrant upsert/search hooks with NVIDIA embeddings
- Thin OpenAI-compatible AI provider abstraction: `NvidiaNimProvider`, `GroqProvider`
- Strict JSON prompt, markdown fence stripping, defensive parsing
- React dashboard for PRs, scores, comments, and files changed
- Docker Compose for backend, frontend, MySQL, Qdrant

## Future work

- Auto-fix generation
- Duplicate comment detection
- Team style learning
- Risk prediction
- Richer repository documentation ingestion
- GitHub Actions CI hardening
