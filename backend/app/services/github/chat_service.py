import uuid
from typing import Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import logger
from app.services.github.embedding_service import EmbeddingService
from app.services.github.qdrant_service import QdrantService
from app.services.github.postgres_service import PostgresService
from app.services.github.gemini_service import GeminiService

class ChatService:
    """Implements Retrieval-Augmented Generation (RAG) to conduct highly contextual, repository-aware conversations."""

    @classmethod
    async def process_user_query(
        cls,
        db: AsyncSession,
        analysis_id: uuid.UUID,
        question: str
    ) -> Dict[str, Any]:
        """
        Retrieves relevant source code embeddings, constructs contextual prompts, 
        interfaces with Gemini, and records interactions in PostgreSQL.
        """
        # 1. Fetch analysis details
        report = await PostgresService.get_report_by_job_id(db, analysis_id)
        if not report:
            raise ValueError(f"Report or analysis records not found for ID: {analysis_id}")

        logger.info(f"RAG Chat: Initiating query on analysis {analysis_id}. Query: '{question}'")

        # 2. Compute question query embedding using Sentence Transformers
        query_vector = EmbeddingService.generate_embedding(question)

        # 3. Retrieve similar chunks matching the cosine threshold in Qdrant
        similar_hits = QdrantService.search_similar_chunks(analysis_id=str(analysis_id), query_vector=query_vector, top_k=5)
        
        # 4. Synthesize context payload
        context_chunks = []
        sources = []
        for hit in similar_hits:
            context_chunks.append(f"--- FILE: {hit['path']} (Score: {hit['score']:.4f}) ---\n{hit['content']}")
            sources.append({
                "file_name": hit["file_name"],
                "chunk_id": str(hit["chunk_id"]),
                "path": hit["path"]
            })

        context_block = "\n\n".join(context_chunks)

        # 5. Formulate strict system context guidelines
        system_instruction = (
            "You are MergeLens Copilot, an expert software architecture advisor. "
            "Below is code snippet context extracted from the repository similar to the user's question. "
            "Provide accurate, actionable answers based strictly on the context provided. "
            "If the snippet lacks context, clearly state that you are answering from general expertise."
        )

        prompt = (
            f"User Question: {question}\n\n"
            f"=== RETRIEVED REPOSITORY CONTEXT ===\n"
            f"{context_block}\n"
            f"====================================\n\n"
            f"Answer the question clearly referencing specific file patterns where applicable."
        )

        # 6. Execute Gemini Generation
        answer = GeminiService.generate_review(prompt=prompt, system_instruction=system_instruction)

        # 7. Record conversation trace in PostgreSQL
        chat_session = await PostgresService.get_or_create_chat_session_by_repo(db, report.repository_id)
        
        # Save user message
        await PostgresService.save_chat_message(
            db=db,
            session_id=chat_session.id,
            role="user",
            content=question
        )
        
        # Save assistant message with reference sources
        await PostgresService.save_chat_message(
            db=db,
            session_id=chat_session.id,
            role="assistant",
            content=answer,
            retrieved_sources=sources
        )

        return {
            "answer": answer,
            "sources": sources
        }
