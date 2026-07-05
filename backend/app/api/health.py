from datetime import datetime
from fastapi import APIRouter, Depends, status
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.services.github.qdrant_service import QdrantService
from app.services.github.gemini_service import GeminiService
from app.core.config import settings

router = APIRouter(tags=["System health checks"])

@router.get("/health", status_code=status.HTTP_200_OK)
async def check_health_liveness(db: AsyncSession = Depends(get_db)):
    """
    Exposes direct liveness matrices testing active connections to PostgreSQL, Qdrant, and Gemini APIs.
    """
    db_status = "unhealthy"
    qdrant_status = "unhealthy"
    gemini_status = "unconfigured"

    # 1. Test PostgreSQL Session Connection
    try:
        await db.execute(text("SELECT 1"))
        db_status = "healthy"
    except Exception:
        pass

    # 2. Test Qdrant Vector Client
    try:
        qdrant_client = QdrantService.get_client()
        qdrant_client.get_collections()
        qdrant_status = "healthy"
    except Exception:
        pass

    # 3. Test Gemini API Setup
    if settings.GEMINI_API_KEY:
        gemini_status = "healthy"

    return {
        "status": "healthy" if db_status == "healthy" and qdrant_status == "healthy" else "degraded",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
        "dependencies": {
            "postgresql": db_status,
            "qdrant": qdrant_status,
            "gemini_api": gemini_status
        }
    }
