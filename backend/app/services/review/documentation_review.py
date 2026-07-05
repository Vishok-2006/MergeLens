from typing import Dict, Any, List

class DocumentationReviewer:
    """Evaluates README structures, installation guidelines, dependency documentation, and inline comments."""

    @staticmethod
    def build_prompt(readme_content: str, folder_tree: Dict[str, Any]) -> str:
        """Formulates documentation audit requests."""
        return f"""
        Audit the documentation and setup instructions for this repository:
        README content preview:
        {readme_content[:2000]}

        Directory structure:
        {folder_tree}

        Review for:
        1. Clarity of installation, env configuration, and run guides.
        2. Descriptions of API endpoints, architecture maps, or database setups.
        3. Document completeness and lists of missing assets.
        
        Provide a documentation score (0-100), a readme critique review, and specific suggestions for improvement.
        """

    @staticmethod
    def get_fallback_assessment() -> Dict[str, Any]:
        """Secures fallback reviews in case of API constraints."""
        return {
            "score": 75,
            "readmeReview": "The README contains standard installation instructions but lacks advanced configuration steps, environmental variable definitions, or API contract specifications.",
            "missingDocs": [
                "API endpoint schema documentation",
                "Environment configuration (.env.example) guide",
                "Architectural block diagrams"
            ],
            "suggestions": [
                "Document all third-party environmental variables and security parameters.",
                "Add quick-start shell scripts or run commands."
            ]
        }
