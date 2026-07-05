import re
import os
from fastapi import HTTPException, status
from app.core.config import settings
from app.core.logging import logger

# Strict match for "owner/repo" formatting (only letters, numbers, hyphens, and underscores)
REPO_PATTERN = re.compile(r"^[a-zA-Z0-9_\-\.]+/[a-zA-Z0-9_\-\.]+$")

def validate_repository_name(repository: str) -> str:
    """
    Asserts if repository name conforms to standard owner/repo-name patterns.
    Throws HTTPException if malformed or containing risky code symbols.
    """
    clean_repo = repository.strip().strip("/")
    if not REPO_PATTERN.match(clean_repo):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Malformed repository input format. Expected format: 'owner/repository'."
        )
    return clean_repo

def prevent_path_traversal(base_path: str, target_path: str) -> str:
    """
    Secures relative workspace traversals.
    Throws Exception if resolved path escapes the defined base directory bounds.
    """
    abs_base = os.path.abspath(base_path)
    abs_target = os.path.abspath(target_path)
    
    if not abs_target.startswith(abs_base):
        raise ValueError(f"Security Alert: Path traversal attempt blocked outside base limits: {target_path}")
    
    return abs_target

def validate_file_constraints(file_size: int, file_path: str) -> bool:
    """
    Filters out massive bundle outputs or build files to avoid system degradation.
    """
    if file_size > settings.MAX_FILE_SIZE:
        logger.debug(f"Skipping indexing of {file_path}: File size exceeds safety limits ({file_size} bytes).")
        return False
    return True
