import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from sqlalchemy import select, update, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.models import (
    Repository,
    RepositoryMetrics,
    AnalysisJob,
    AnalysisReport,
    Recommendation,
    ChatSession,
    ChatMessage,
    AnalysisHistory
)
from app.core.logging import logger

class PostgresService:
    """Core PostgreSQL Service handles transactional operations on all relational entities."""

    @staticmethod
    async def get_or_create_repository(
        db: AsyncSession, 
        owner: str, 
        name: str, 
        url: str
    ) -> Repository:
        """Retrieves repository by owner/name or initializes schema fields if new."""
        stmt = select(Repository).where(
            Repository.owner == owner,
            Repository.name == name,
            Repository.is_deleted == False # type: ignore
        )
        res = await db.execute(stmt)
        repo = res.scalars().first()

        if not repo:
            logger.info(f"Adding new repository mapping to database: {owner}/{name}")
            repo = Repository(owner=owner, name=name, url=url)
            db.add(repo)
            await db.commit()
            await db.refresh(repo)
        return repo

    @staticmethod
    async def create_analysis_job(
        db: AsyncSession, 
        repository_id: uuid.UUID
    ) -> AnalysisJob:
        """Creates a tracking job record with pending status."""
        job = AnalysisJob(repository_id=repository_id, status="pending", progress=0)
        db.add(job)
        await db.commit()
        await db.refresh(job)
        return job

    @staticmethod
    async def update_job_status(
        db: AsyncSession, 
        job_id: uuid.UUID, 
        status: str, 
        progress: int, 
        message: str,
        error_log: Optional[str] = None
    ) -> None:
        """Atomically updates job state coordinates on worker completions."""
        stmt = (
            update(AnalysisJob)
            .where(AnalysisJob.id == job_id)
            .values(
                status=status,
                progress=progress,
                message=message,
                error_log=error_log,
                updated_at=datetime.now(timezone.utc)
            )
        )
        await db.execute(stmt)
        await db.commit()

    @staticmethod
    async def get_job(db: AsyncSession, job_id: uuid.UUID) -> Optional[AnalysisJob]:
        """Loads analysis job details."""
        stmt = select(AnalysisJob).where(AnalysisJob.id == job_id)
        res = await db.execute(stmt)
        return res.scalars().first()

    @staticmethod
    async def save_repository_metrics(
        db: AsyncSession,
        repository_id: uuid.UUID,
        metrics_data: Dict[str, Any]
    ) -> RepositoryMetrics:
        """Upserts repository statistics and physical counts."""
        stmt = select(RepositoryMetrics).where(RepositoryMetrics.repository_id == repository_id)
        res = await db.execute(stmt)
        metrics = res.scalars().first()

        if not metrics:
            metrics = RepositoryMetrics(repository_id=repository_id)
            db.add(metrics)

        metrics.stars = metrics_data.get("stars", 0)
        metrics.forks = metrics_data.get("forks", 0)
        metrics.contributors_count = metrics_data.get("contributors", 0)
        metrics.languages = metrics_data.get("languages", {})
        metrics.primary_framework = metrics_data.get("primary_framework", "Unknown")
        metrics.repository_size_kb = metrics_data.get("repository_size_kb", 0)
        metrics.health_score = metrics_data.get("health_score", 100.0)
        metrics.risk_score = metrics_data.get("risk_score", 0.0)
        metrics.updated_at = datetime.now(timezone.utc)

        await db.commit()
        await db.refresh(metrics)
        return metrics

    @staticmethod
    async def save_analysis_report(
        db: AsyncSession,
        repository_id: uuid.UUID,
        job_id: uuid.UUID,
        report_payload: Dict[str, Any],
        recommendations: List[Dict[str, Any]]
    ) -> AnalysisReport:
        """Saves generated engineering review alongside action recommendations."""
        report = AnalysisReport(
            repository_id=repository_id,
            job_id=job_id,
            executive_summary=report_payload.get("executive_summary", ""),
            architecture_summary=report_payload.get("architecture_summary", ""),
            code_quality_summary=report_payload.get("code_quality_summary", ""),
            security_summary=report_payload.get("security_summary", ""),
            performance_summary=report_payload.get("performance_summary", ""),
            documentation_summary=report_payload.get("documentation_summary", ""),
            testing_summary=report_payload.get("testing_summary", ""),
            health_score=report_payload.get("health_score", 100.0),
            risk_score=report_payload.get("risk_score", 0.0),
            directory_structure=report_payload.get("directory_structure", {})
        )
        db.add(report)
        await db.flush() # Flush to resolve report.id

        # Insert recommendations
        for rec in recommendations:
            recommendation_obj = Recommendation(
                report_id=report.id,
                title=rec.get("title", "Untitled Fix"),
                description=rec.get("description", ""),
                priority=rec.get("priority", "medium"),
                impact=rec.get("impact", ""),
                suggested_fix=rec.get("suggested_fix", ""),
                category=rec.get("category", "general")
            )
            db.add(recommendation_obj)

        # Log completion log
        history = AnalysisHistory(
            repository_id=repository_id,
            status="completed",
            summary=report.executive_summary[:300] + "..."
        )
        db.add(history)

        await db.commit()
        await db.refresh(report)
        return report

    @staticmethod
    async def get_report_by_job_id(db: AsyncSession, job_id: uuid.UUID) -> Optional[AnalysisReport]:
        """Retrieves completed report including loaded child recommendations."""
        stmt = (
            select(AnalysisReport)
            .where(AnalysisReport.job_id == job_id)
            .options(selectinload(AnalysisReport.recommendations))
        )
        res = await db.execute(stmt)
        return res.scalars().first()

    @staticmethod
    async def get_report_by_id(db: AsyncSession, report_id: uuid.UUID) -> Optional[AnalysisReport]:
        """Loads direct report by report UUID primary key."""
        stmt = (
            select(AnalysisReport)
            .where(AnalysisReport.id == report_id)
            .options(selectinload(AnalysisReport.recommendations))
        )
        res = await db.execute(stmt)
        return res.scalars().first()

    @staticmethod
    async def get_repository_by_id(db: AsyncSession, repo_id: uuid.UUID) -> Optional[Repository]:
        """Loads repository profile metadata including metrics model."""
        stmt = (
            select(Repository)
            .where(Repository.id == repo_id, Repository.is_deleted == False) # type: ignore
            .options(selectinload(Repository.metrics))
        )
        res = await db.execute(stmt)
        return res.scalars().first()

    @staticmethod
    async def create_chat_session(db: AsyncSession, repository_id: uuid.UUID, title: str) -> ChatSession:
        """Creates a conversational context chat tracking thread."""
        session = ChatSession(repository_id=repository_id, title=title)
        db.add(session)
        await db.commit()
        await db.refresh(session)
        return session

    @staticmethod
    async def get_or_create_chat_session_by_repo(db: AsyncSession, repository_id: uuid.UUID) -> ChatSession:
        """Finds or initializes chat conversation context session."""
        stmt = select(ChatSession).where(ChatSession.repository_id == repository_id).order_by(ChatSession.created_at.desc())
        res = await db.execute(stmt)
        session = res.scalars().first()
        if not session:
            session = await PostgresService.create_chat_session(db, repository_id, "Repo contextual conversation")
        return session

    @staticmethod
    async def save_chat_message(
        db: AsyncSession,
        session_id: uuid.UUID,
        role: str,
        content: str,
        retrieved_sources: Optional[List[Dict[str, Any]]] = None
    ) -> ChatMessage:
        """Saves individual conversation context responses."""
        msg = ChatMessage(
            session_id=session_id,
            role=role,
            content=content,
            retrieved_sources=retrieved_sources
        )
        db.add(msg)
        await db.commit()
        await db.refresh(msg)
        return msg

    @staticmethod
    async def get_chat_history(db: AsyncSession, session_id: uuid.UUID) -> List[ChatMessage]:
        """Retrieves fully chronological listing of conversations of given session."""
        stmt = select(ChatMessage).where(ChatMessage.session_id == session_id).order_by(ChatMessage.created_at.asc())
        res = await db.execute(stmt)
        return list(res.scalars().all())
