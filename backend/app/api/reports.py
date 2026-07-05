import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.services.github.postgres_service import PostgresService

router = APIRouter(prefix="/api", tags=["Detailed Statistics"])

@router.get("/report/{id}")
async def get_report_by_report_id(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    """Loads a full completed report directly by its specific report id."""
    report = await PostgresService.get_report_by_id(db, id)
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report with ID {id} was not found."
        )

    return {
        "status": "success",
        "data": {
            "id": str(report.id),
            "repository_id": str(report.repository_id),
            "executive_summary": report.executive_summary,
            "architecture_summary": report.architecture_summary,
            "code_quality_summary": report.code_quality_summary,
            "security_summary": report.security_summary,
            "performance_summary": report.performance_summary,
            "documentation_summary": report.documentation_summary,
            "testing_summary": report.testing_summary,
            "health_score": report.health_score,
            "risk_score": report.risk_score,
            "created_at": report.created_at.isoformat()
        },
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@router.get("/repositories/{id}/structure")
async def get_repository_directory_tree(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    """Loads file tree coordinates for interactive visualization charts."""
    # Load report of the latest completed analysis job associated with the repo
    repo = await PostgresService.get_repository_by_id(db, id)
    if not repo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Repository profile with ID {id} not found."
        )

    # Search completed report
    completed_job = next((job for job in sorted(repo.jobs, key=lambda j: j.created_at, reverse=True) if job.status == "completed"), None)
    if not completed_job:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No completed analysis reports exist for this repository."
        )

    report = await PostgresService.get_report_by_job_id(db, completed_job.id)
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Associated structural analysis records could not be loaded."
        )

    return {
        "status": "success",
        "data": {
            "repository_id": str(id),
            "directory_structure": report.directory_structure
        },
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@router.get("/repositories/{id}/metrics")
async def get_repository_dashboard_metrics(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    """Retrieves star counts, languages ratio, frameworks, and computed score states."""
    repo = await PostgresService.get_repository_by_id(db, id)
    if not repo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Repository profile with ID {id} not found."
        )

    if not repo.metrics:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Detailed statistics for this repository are not compiled yet."
        )

    return {
        "status": "success",
        "data": {
            "repository_id": str(id),
            "stars": repo.metrics.stars,
            "forks": repo.metrics.forks,
            "contributors_count": repo.metrics.contributors_count,
            "languages": repo.metrics.languages,
            "primary_framework": repo.metrics.primary_framework,
            "repository_size_kb": repo.metrics.repository_size_kb,
            "health_score": repo.metrics.health_score,
            "risk_score": repo.metrics.risk_score
        },
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
