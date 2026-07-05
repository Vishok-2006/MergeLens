import os
import shutil
import uuid
from git import Repo
from app.core.config import settings
from app.core.logging import logger
from app.core.security import prevent_path_traversal

class RepositoryLoader:
    """Clones public repositories using GitPython, providing standard temporary directory sandboxing."""

    @staticmethod
    def get_workspace_path(job_id: str) -> str:
        """Determines secure sandboxed path for given analytical jobs."""
        workspace_root = os.path.abspath(settings.TEMP_DIRECTORY)
        target_path = os.path.join(workspace_root, job_id)
        return prevent_path_traversal(workspace_root, target_path)

    @classmethod
    async def clone_repository(cls, repo_url: str, job_id: str) -> str:
        """
        Clones public Git repositories asynchronously within isolated workspace.
        Cleans previous workspace contents if colliding.
        """
        target_dir = cls.get_workspace_path(job_id)
        
        # Guard cleanup
        if os.path.exists(target_dir):
            shutil.rmtree(target_dir)
        os.makedirs(target_dir, exist_ok=True)

        logger.info(f"Cloning repository: {repo_url} into target workspace {target_dir}")
        try:
            # Clone with progress tracing depth 1 to optimize bandwidth efficiency
            Repo.clone_from(
                repo_url, 
                target_dir, 
                depth=1,
                multi_options=["--no-single-branch", "--depth=1"]
            )
            logger.info(f"Cloned successfully: {repo_url}")
            return target_dir
        except Exception as e:
            logger.error(f"Clone failure: {repo_url}. Detail: {str(e)}")
            cls.cleanup_workspace(job_id)
            raise RuntimeError(f"Git checkout failed: {str(e)}")

    @classmethod
    def cleanup_workspace(cls, job_id: str) -> None:
        """Safely removes workspace directory post analyses or on failures."""
        try:
            target_dir = cls.get_workspace_path(job_id)
            if os.path.exists(target_dir):
                shutil.rmtree(target_dir)
                logger.info(f"Sanitized workspace directory: {target_dir}")
        except Exception as e:
            logger.warning(f"Error during workspace sanitation for job {job_id}: {str(e)}")
stream_class = RepositoryLoader
