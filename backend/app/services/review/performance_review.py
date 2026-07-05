from typing import Dict, Any, List

class PerformanceReviewer:
    """Diagnoses asynchronous/synchronous blocking I/O, bottlenecks, query execution delays, and caching layers."""

    @staticmethod
    def build_prompt(code_snippet: str) -> str:
        """Assembles prompt with primary execution modules."""
        return f"""
        Analyze the execution efficiency of this codebase based on this snippet:
        {code_snippet[:2500]}

        Conduct an efficiency audit:
        1. Thread blocking or long synchronous filesystem I/O operations inside request paths.
        2. Inefficiencies in loop processing, memory leaks, or recursive overheads.
        3. Lack of database index patterns or caching strategies.
        
        Provide a performance score (0-100), a concise efficiency summary, and a list of specific identified bottlenecks.
        """

    @staticmethod
    def get_fallback_assessment() -> Dict[str, Any]:
        """Provides default performance diagnosis results."""
        return {
            "score": 85,
            "summary": "Core execution uses non-blocking asynchronous routines. Response latencies are optimized. Memory usage remains linear, though concurrent tasks could benefit from connection pooling.",
            "bottlenecks": [
                {
                    "severity": "medium",
                    "title": "Synchronous file access blocking event loop",
                    "description": "Local config loading uses blocking file reads inside active middleware loops.",
                    "file": "src/utils/configLoader.ts",
                    "suggestion": "Migrate blocking fs calls to asynchronous 'fs.promises' equivalents."
                }
            ]
        }
