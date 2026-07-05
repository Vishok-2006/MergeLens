import uuid
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import (
    String, 
    Integer, 
    Float, 
    Text, 
    Boolean, 
    ForeignKey, 
    DateTime, 
    Index, 
    JSON
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class Repository(Base):
    __tablename__ = "repositories"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    owner: Mapped[str] = mapped_column(String(150), nullable=False)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    url: Mapped[str] = mapped_column(String(500), nullable=False)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    # Relationships
    metrics: Mapped[Optional["RepositoryMetrics"]] = relationship("RepositoryMetrics", back_populates="repository", cascade="all, delete-orphan", uselist=False)
    jobs: Mapped[List["AnalysisJob"]] = relationship("AnalysisJob", back_populates="repository", cascade="all, delete-orphan")
    reports: Mapped[List["AnalysisReport"]] = relationship("AnalysisReport", back_populates="repository", cascade="all, delete-orphan")
    chat_sessions: Mapped[List["ChatSession"]] = relationship("ChatSession", back_populates="repository", cascade="all, delete-orphan")
    history_logs: Mapped[List["AnalysisHistory"]] = relationship("AnalysisHistory", back_populates="repository", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_repo_owner_name", "owner", "name", unique=True),
    )


class RepositoryMetrics(Base):
    __tablename__ = "repository_metrics"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    repository_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("repositories.id", ondelete="CASCADE"), unique=True)
    stars: Mapped[int] = mapped_column(Integer, default=0)
    forks: Mapped[int] = mapped_column(Integer, default=0)
    contributors_count: Mapped[int] = mapped_column(Integer, default=0)
    languages: Mapped[dict] = mapped_column(JSON, default=dict) # e.g. {"Python": 80, "TypeScript": 20}
    primary_framework: Mapped[str] = mapped_column(String(100), default="Unknown")
    repository_size_kb: Mapped[int] = mapped_column(Integer, default=0)
    health_score: Mapped[float] = mapped_column(Float, default=100.0)
    risk_score: Mapped[float] = mapped_column(Float, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    # Relationships
    repository: Mapped["Repository"] = relationship("Repository", back_populates="metrics")


class AnalysisJob(Base):
    __tablename__ = "analysis_jobs"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    repository_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("repositories.id", ondelete="CASCADE"))
    status: Mapped[str] = mapped_column(String(50), default="pending") # pending, downloading, parsing, embedding, generating_ai, completed, failed
    progress: Mapped[int] = mapped_column(Integer, default=0) # 0 to 100
    message: Mapped[str] = mapped_column(String(500), default="Initializing analysis workflow")
    error_log: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    # Relationships
    repository: Mapped["Repository"] = relationship("Repository", back_populates="jobs")


class AnalysisReport(Base):
    __tablename__ = "analysis_reports"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    repository_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("repositories.id", ondelete="CASCADE"))
    job_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("analysis_jobs.id", ondelete="CASCADE"))
    
    # Analysis Summaries
    executive_summary: Mapped[str] = mapped_column(Text)
    architecture_summary: Mapped[str] = mapped_column(Text)
    code_quality_summary: Mapped[str] = mapped_column(Text)
    security_summary: Mapped[str] = mapped_column(Text)
    performance_summary: Mapped[str] = mapped_column(Text)
    documentation_summary: Mapped[str] = mapped_column(Text)
    testing_summary: Mapped[str] = mapped_column(Text)
    
    # Consolidated Metrics
    health_score: Mapped[float] = mapped_column(Float, default=100.0)
    risk_score: Mapped[float] = mapped_column(Float, default=0.0)
    
    # Store complete metadata of tree structure
    directory_structure: Mapped[dict] = mapped_column(JSON, default=dict)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    # Relationships
    repository: Mapped["Repository"] = relationship("Repository", back_populates="reports")
    recommendations: Mapped[List["Recommendation"]] = relationship("Recommendation", back_populates="report", cascade="all, delete-orphan")


class Recommendation(Base):
    __tablename__ = "recommendations"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    report_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("analysis_reports.id", ondelete="CASCADE"))
    title: Mapped[str] = mapped_column(String(250), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    priority: Mapped[str] = mapped_column(String(50), nullable=False) # high, medium, low
    impact: Mapped[str] = mapped_column(Text, nullable=False)
    suggested_fix: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=False) # security, performance, structure, code_smell
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    # Relationships
    report: Mapped["AnalysisReport"] = relationship("AnalysisReport", back_populates="recommendations")


class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    repository_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("repositories.id", ondelete="CASCADE"))
    title: Mapped[str] = mapped_column(String(200), default="New context chat")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    # Relationships
    repository: Mapped["Repository"] = relationship("Repository", back_populates="chat_sessions")
    messages: Mapped[List["ChatMessage"]] = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    session_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("chat_sessions.id", ondelete="CASCADE"))
    role: Mapped[str] = mapped_column(String(50)) # user, assistant
    content: Mapped[str] = mapped_column(Text)
    retrieved_sources: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True) # e.g. [{"file": "...", "chunk": 1}]
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    # Relationships
    session: Mapped["ChatSession"] = relationship("ChatSession", back_populates="messages")


class AnalysisHistory(Base):
    __tablename__ = "analysis_history"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    repository_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("repositories.id", ondelete="CASCADE"))
    status: Mapped[str] = mapped_column(String(50)) # completed, failed
    trigger_type: Mapped[str] = mapped_column(String(50), default="manual") # manual, cron
    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    # Relationships
    repository: Mapped["Repository"] = relationship("Repository", back_populates="history_logs")
