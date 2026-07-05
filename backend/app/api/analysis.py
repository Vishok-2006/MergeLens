import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.db.schemas import RepositoryCreate, AnalysisJobResponse
from app.services.github.analysis_service import AnalysisService
from app.services.github.postgres_service import PostgresService
from app.services.github.report_service import ReportService

router = APIRouter(prefix="/api", tags=["Repository Analysis"])

@router.post("/analyze", status_code=status.HTTP_202_ACCEPTED)
async def start_repository_analysis(
    payload: RepositoryCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Registers repository details and starts asynchronous code parser / AI review generation task.
    """
    try:
        job_id = await AnalysisService.start_analysis_workflow(db, payload.repository)
        return {
            "status": "success",
            "message": "Repository registered successfully. Analysis job triggered.",
            "data": {
                "id": str(job_id),
                "status": "processing"
            },
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except ValueError as val_err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(val_err))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unable to trigger analysis workflow: {str(e)}"
        )

@router.get("/analysis/{id}")
async def get_analysis_status_and_report(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    Returns complete analysis details if completed, otherwise outputs raw background task progress codes.
    """
    job = await PostgresService.get_job(db, id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Analysis job with ID {id} was not found."
        )

    # Compile result response
    response_data = {
        "id": str(job.id),
        "status": job.status,
        "progress": job.progress,
        "message": job.message,
        "error": job.error_log,
        "report": None
    }

    # If completed, inject full compiled report payload
    if job.status == "completed":
        report_data = await ReportService.get_report_by_job_id(db, job.id)
        response_data["report"] = report_data # type: ignore

    return {
        "status": "success",
        "data": response_data,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
