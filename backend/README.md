# MergeLens Backend

MergeLens is an AI-powered Repository Intelligence Platform. It downloads, indexes, and analyzes public GitHub repositories using a modern, production-grade tech stack.

## Tech Stack

- **Framework:** FastAPI
- **Database:** PostgreSQL (with SQLAlchemy 2.0 ORM & Alembic migrations)
- **Vector Search:** Qdrant Vector Database
- **Embeddings:** Sentence Transformers (`BAAI/bge-small-en-v1.5`)
- **Intelligence Model:** Google Gemini API (`gemini-2.5-flash` or similar)
- **Git Interaction:** GitPython

---

## Folder Structure

```
backend/
├── app/
│   ├── main.py
│   ├── core/
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── logging.py
│   │   └── security.py
│   ├── db/
│   │   ├── models.py
│   │   └── schemas.py
│   ├── services/
│   │   ├── github/
│   │   │   ├── repository_loader.py
│   │   │   ├── repository_parser.py
│   │   │   ├── framework_detector.py
│   │   │   ├── chunking.py
│   │   │   ├── embedding_service.py
│   │   │   ├── qdrant_service.py
│   │   │   ├── postgres_service.py
│   │   │   ├── analysis_service.py
│   │   │   ├── chat_service.py
│   │   │   ├── gemini_service.py
│   │   │   └── report_service.py
│   │   └── review/
│   │       ├── architecture_review.py
│   │       ├── code_review.py
│   │       ├── security_review.py
│   │       ├── performance_review.py
│   │       ├── documentation_review.py
│   │       └── testing_review.py
│   └── api/
│       ├── health.py
│       ├── analysis.py
│       ├── chat.py
│       └── reports.py
└── requirements.txt
```

---

## Setup and Running

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Configure Environment Variables:**
   Create a `.env` file or export the following variables:
   - `DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/mergelens`
   - `QDRANT_URL=http://localhost:6333`
   - `QDRANT_API_KEY=` (optional if local)
   - `GEMINI_API_KEY=AIzaSy...`
   - `GITHUB_TOKEN=` (optional, raises GitHub rate limits)

3. **Start the FastAPI application:**
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```
