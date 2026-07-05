import time
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONEncoder
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timezone

from app.core.config import settings
from app.core.logging import setup_logging, logger
from app.core.database import engine, Base
from app.api import health, analysis, chat, reports

# Setup structured console logs
setup_logging()

app = FastAPI(
    title="MergeLens API",
    description="AI-Powered Repository Intelligence Platform Backend services",
    version="1.0.0"
)

# CORS Configuration setup for multi-service interfaces
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In development. Configure specifically in production environments.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(health.router)
app.include_router(analysis.router)
app.include_router(chat.router)
app.include_router(reports.router)

@app.on_event("startup")
async def startup_event_bootstrap():
    """Bootstraps application database schemas on deployment startup."""
    logger.info("Initializing MergeLens service dependencies...")
    try:
        async with engine.begin() as conn:
            # Automatic schema creation matching metadata
            logger.info("Syncing and creating PostgreSQL tables...")
            await conn.run_sync(Base.metadata.create_all)
            logger.info("PostgreSQL schemas initialized successfully.")
    except Exception as e:
        logger.error(f"Critical error during database schema creation: {str(e)}")

@app.on_event("shutdown")
async def shutdown_event_teardown():
    """Teardown database pools and clean references."""
    logger.info("Closing active connection pools...")
    await engine.dispose()

@app.middleware("http")
async def logging_timing_middleware(request: Request, call_next):
    """Logs resource access metrics and transaction latency profiles."""
    start_time = time.time()
    response = await call_next(request)
    duration_ms = (time.time() - start_time) * 1000.0
    
    logger.info(
        f"{request.method} {request.url.path} - {response.status_code} "
        f"completed in {duration_ms:.2f}ms"
    )
    return response

@app.exception_handler(Exception)
async def global_unhandled_exception_handler(request: Request, exc: Exception):
    """
    Transforms any internal server exception into unified formatted JSON schemas.
    """
    logger.error(f"Internal server error on {request.url.path}: {str(exc)}", exc_info=exc)
    return JSONEncoder().encode({
        "status": "failed",
        "message": "An unexpected error occurred during operation.",
        "data": None,
        "errors": [str(exc)],
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
