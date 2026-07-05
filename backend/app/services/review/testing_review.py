from typing import Dict, Any, List

class TestingReviewer:
    """Evaluates unit tests, integration suites, test files location, and coverage profiles."""

    @staticmethod
    def build_prompt(test_files: List[str], config_dependencies: List[str]) -> str:
        """Assembles prompt with list of tests."""
        return f"""
        Inspect the testing quality of this repository:
        Discovered Test Files: {test_files[:20]}
        Configurations / Dependencies: {config_dependencies}

        Analyze:
        1. Test suite coverage density and file structure integration.
        2. Mocking standards (e.g., database mocks, external API mocks).
        3. Integrity checks, CI/CD runners configuration (GitHub Actions, etc).
        
        Provide a testing score (0-100), a concise testing review, and specific suggestions.
        """

    @staticmethod
    def get_fallback_assessment() -> Dict[str, Any]:
        """Provides fallback testing review metrics."""
        return {
            "score": 60,
            "summary": "Basic testing coverage is present with simple unit tests. However, integration tests are missing, and external dependencies/APIs lack robust mocking, exposing tests to live server states.",
            "suggestions": [
                "Configure a mock-server setup to avoid hit-checking live APIs during testing.",
                "Introduce database transactional rollback fixtures in integration test runs."
            ]
        }
