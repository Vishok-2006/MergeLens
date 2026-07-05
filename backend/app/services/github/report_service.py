import uuid
from typing import Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.github.postgres_service import PostgresService

class ReportService:
    """Consolidates analytical reports and action recommendations."""

    @staticmethod
    async def get_report_by_job_id(db: AsyncSession, job_id: uuid.UUID) -> Optional[Dict[str, Any]]:
        """Retrieves and prepares complete nested database report payload."""
        report = await PostgresService.get_report_by_job_id(db, job_id)
        if not report:
            return None

        return {
            "id": report.id,
            "repository_id": report.repository_id,
            "job_id": report.job_id,
            "executive_summary": report.executive_summary,
            "architecture_summary": report.architecture_summary,
            "code_quality_summary": report.code_quality_summary,
            "security_summary": report.security_summary,
            "performance_summary": report.performance_summary,
            "documentation_summary": report.documentation_summary,
            "testing_summary": report.testing_summary,
            "health_score": report.health_score,
            "risk_score": report.risk_score,
            "directory_structure": report.directory_structure,
            "recommendations": [
                {
                    "id": rec.id,
                    "title": rec.title,
                    "description": rec.description,
                    "priority": rec.priority,
                    "impact": rec.impact,
                    "suggested_fix": rec.suggested_fix,
                    "category": rec.category
                } for rec in report.recommendations
            ],
            "created_at": report.created_at
        }
