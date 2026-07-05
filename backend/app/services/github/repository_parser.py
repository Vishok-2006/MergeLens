import os
from typing import Dict, List, Any, Tuple
from git import Repo
from app.core.config import settings
from app.core.logging import logger
from app.core.security import validate_file_constraints

IGNORE_DIRS = {
    ".git", "node_modules", "dist", "build", "vendor", "target", 
    "coverage", ".idea", ".vscode", "__pycache__", "venv", ".next"
}

class RepositoryParser:
    """Parses local workspace, extracting structural listings, config file states, and git histories."""

    @classmethod
    def list_directory_tree(cls, base_path: str) -> Dict[str, Any]:
        """Recursively parses workspace structures, compiling a nested JSON representation of folders and files."""
        def build_node(current_path: str) -> Dict[str, Any]:
            name = os.path.basename(current_path)
            if os.path.isdir(current_path):
                children = []
                try:
                    for entry in os.listdir(current_path):
                        if entry in IGNORE_DIRS:
                            continue
                        child_full = os.path.join(current_path, entry)
                        children.append(build_node(child_full))
                except Exception as e:
                    logger.debug(f"Unable to read subdirectory {current_path}: {str(e)}")
                
                # Sort folders first, then files
                children.sort(key=lambda x: (x["type"] != "folder", x["name"].lower()))
                return {
                    "name": name if name else "root",
                    "type": "folder",
                    "path": os.path.relpath(current_path, base_path),
                    "children": children
                }
            else:
                return {
                    "name": name,
                    "type": "file",
                    "path": os.path.relpath(current_path, base_path),
                    "size_bytes": os.path.getsize(current_path)
                }

        return build_node(base_path)

    @classmethod
    def load_meaningful_files(cls, base_path: str) -> List[Tuple[str, str]]:
        """
        Traverses directories gathering textual file contents.
        Validates size limits & bypasses build dependencies or binary assets.
        """
        meaningful_files: List[Tuple[str, str]] = []
        for root, dirs, files in os.walk(base_path):
            # Inline modify dirs to ignore folders on traversal
            dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
            
            for file in files:
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, base_path)
                
                # Skip common binaries/images
                if file.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.ico', '.pdf', '.zip', '.tar', '.gz', '.mp3', '.mp4', '.woff', '.woff2', '.ttf')):
                    continue
                
                try:
                    size = os.path.getsize(full_path)
                    if not validate_file_constraints(size, rel_path):
                        continue
                    
                    with open(full_path, 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read()
                        meaningful_files.append((rel_path, content))
                except Exception as e:
                    logger.debug(f"Skipping file {rel_path} due to read error: {str(e)}")
        
        return meaningful_files

    @classmethod
    def parse_commit_history(cls, base_path: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Extracts history logs of the last N commits using GitPython."""
        try:
            repo = Repo(base_path)
            commits = list(repo.iter_commits(max_count=limit))
            history = []
            for commit in commits:
                history.append({
                    "sha": commit.hexsha,
                    "author": commit.author.name,
                    "email": commit.author.email,
                    "message": commit.message.strip(),
                    "date": commit.committed_datetime.isoformat()
                })
            return history
        except Exception as e:
            logger.warning(f"Failed to load commit logs for workspace {base_path}: {str(e)}")
            return []

    @classmethod
    def extract_readme(cls, base_path: str) -> str:
        """Retrieves default README contents from standard files."""
        for name in ["README.md", "readme.md", "README", "readme.txt"]:
            target = os.path.join(base_path, name)
            if os.path.exists(target):
                try:
                    with open(target, 'r', encoding='utf-8', errors='ignore') as f:
                        return f.read()
                except Exception:
                    pass
        return ""
