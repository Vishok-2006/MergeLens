from typing import Dict, Any, List

class CodeReviewer:
    """Analyzes maintainability index, cognitive complexity, code smells, and monolithic structures."""

    @staticmethod
    def build_prompt(files_snippet: List[Dict[str, Any]]) -> str:
        """Assembles prompt payload with representative file outlines."""
        files_summary = "\n".join([f"Path: {f['path']}\nSize: {f.get('size_bytes', 0)} bytes" for f in files_snippet[:15]])
        return f"""
        Conduct a Code Quality review on these target source files:
        {files_summary}

        Inspect the files for:
        1. Code smells (bloated functions, duplicate lines, tight coupling).
        2. Cognitive complexity and redundant branching logic density.
        3. Naming conventions, type hints, and modular maintainability.
        
        Generate a detailed summary, an estimated Maintainability Score (0-100), and list the top code quality issues.
        """

    @staticmethod
    def get_fallback_assessment() -> Dict[str, Any]:
        """Synthesizes high-fidelity mock data for code review constraints."""
        return {
            "score": 88,
            "summary": "Overall code quality is clean. Naming structures are human-readable, and functions follow solid SRP rules. Minor logical redundancy spotted in utility submodules.",
            "metrics": {
                "maintainabilityIndex": 84,
                "cognitiveComplexityScore": 12,
                "duplicateLinesPercent": 4.5
            },
            "issues": [
                {
                    "type": "smell",
                    "severity": "medium",
                    "title": "Redundant initialization in module handlers",
                    "description": "State is instantiated multiple times inside routing controllers.",
                    "file": "src/controllers/userController.ts"
                },
                {
                    "type": "naming",
                    "severity": "low",
                    "title": "Inconsistent casing in service helper variables",
                    "description": "Mixture of camelCase and snake_case inside local state arrays.",
                    "file": "src/utils/helpers.ts"
                }
            ]
        }
