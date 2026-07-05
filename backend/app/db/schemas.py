import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, HttpUrl

class RepositoryCreate(BaseModel):
    repository: str = Field(..., description="Target repository input string (e.g. facebook/react)")

class RepositoryResponse(BaseModel):
    id: uuid.UUID
    owner: str
    name: str
    url: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class RepositoryMetricsResponse(BaseModel):
    stars: int
    forks: int
    contributors_count: int
    languages: Dict[str, float]
    primary_framework: str
    repository_size_kb: int
    health_score: float
    risk_score: float

    class Config:
        from_attributes = True

class AnalysisJobResponse(BaseModel):
    id: uuid.UUID
    repository_id: uuid.UUID
    status: str
    progress: int
    message: str
    error_log: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class RecommendationResponse(BaseModel):
    id: uuid.UUID
    title: str
    description: str
    priority: str
    impact: str
    suggested_fix: str
    category: str

    class Config:
        from_attributes = True

class AnalysisReportResponse(BaseModel):
    id: uuid.UUID
    repository_id: uuid.UUID
    job_id: uuid.UUID
    executive_summary: str
    architecture_summary: str
    code_quality_summary: str
    security_summary: str
    performance_summary: str
    documentation_summary: str
    testing_summary: str
    health_score: float
    risk_score: float
    directory_structure: Dict[str, Any]
    recommendations: List[RecommendationResponse]
    created_at: datetime

    class Config:
        from_attributes = True

class ChatRequest(BaseModel):
    analysis_id: uuid.UUID
    question: str = Field(..., min_length=3, description="Query question regarding repository code context")

class ChatSource(BaseModel):
    file_name: str
    chunk_id: str
    path: str

class ChatResponse(BaseModel):
    answer: str
    sources: List[ChatSource]

class ErrorResponse(BaseModel):
    status: str = "failed"
    message: str
    data: Optional[Dict[str, Any]] = None
    errors: List[str] = []
    timestamp: datetime = Field(default_factory=datetime.utcnow)
