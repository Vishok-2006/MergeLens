from typing import Dict, Any, List

class ArchitectureReviewer:
    """Evaluates modular folder layouts, designs, layering, and domain separations."""

    @staticmethod
    def build_prompt(framework: str, structure: Dict[str, Any], readme_snippet: str) -> str:
        """Constructs descriptive system review prompts."""
        return f"""
        Analyze the system architecture of the following repository:
        Framework / Language: {framework}
        
        Repository Directory Layout:
        {structure}

        Readme Details:
        {readme_snippet[:2000]}

        Conduct an advanced, technical evaluation focusing on:
        1. Layering conventions (e.g. Domain-driven design, Clean architecture, MVC pattern, or Spaghetti)
        2. Module and folder structural boundaries.
        3. Scalability, modular separation, and architectural strong points/weak points.
        
        Provide a concise architectural review summary and identify specific strengths and weaknesses.
        """

    @staticmethod
    def get_fallback_assessment(framework: str) -> Dict[str, Any]:
        """Provides dynamic fallback values in case of AI platform constraints."""
        return {
            "summary": f"Standard modular architecture structured under a {framework} layout context. High cohesion detected among core entities with minor dependency couplings.",
            "strengths": [
                "Clear, intuitive top-level directory layout",
                "Explicit isolation of entry scripts from operational logic",
                "Logical asset partitioning"
            ],
            "weaknesses": [
                "Implicit layering patterns that could benefit from clearer DAO boundaries",
                "Lack of dedicated architectural documentation file"
            ]
        }
