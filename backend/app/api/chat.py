import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.db.schemas import ChatRequest, ChatResponse
from app.services.github.chat_service import ChatService

router = APIRouter(prefix="/api", tags=["RAG Interactive Copilot"])

@router.post("/chat", response_model=None)
async def query_repository_copilot(
    payload: ChatRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    RAG-based conversational AI query. Computes embeddings, searches Qdrant, and sends contextual prompt to Gemini.
    """
    try:
        result = await ChatService.process_user_query(
            db=db,
            analysis_id=payload.analysis_id,
            question=payload.question
        )
        return {
            "status": "success",
            "data": {
                "answer": result["answer"],
                "sources": result["sources"]
            },
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except ValueError as val_err:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(val_err))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Chat assistant retrieval context failed: {str(e)}"
        )
