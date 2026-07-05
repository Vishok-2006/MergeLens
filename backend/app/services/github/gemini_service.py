import os
import json
from typing import Dict, Any, List
import google.generativeai as genai
from app.core.config import settings
from app.core.logging import logger

class GeminiService:
    """Manages AI analysis requests and structured code context evaluations with Google Gemini."""

    _initialized = False

    @classmethod
    def _initialize_sdk(cls) -> None:
        """Configures globally configured credentials."""
        if not cls._initialized:
            api_key = settings.GEMINI_API_KEY
            if not api_key:
                logger.warning("GEMINI_API_KEY environment variable is not configured. Falling back to default heuristics.")
            else:
                genai.configure(api_key=api_key)
                cls._initialized = True

    @classmethod
    def generate_review(cls, prompt: str, system_instruction: str = "") -> str:
        """
        Sends complete structural reviews to Gemini model.
        Returns pure text response.
        """
        cls._initialize_sdk()
        if not cls._initialized:
            return "Unable to perform AI Generation: GEMINI_API_KEY is not defined."

        try:
            # We use gemini-2.5-flash as the fast, cost-effective default model
            model = genai.GenerativeModel(
                model_name="gemini-2.5-flash",
                system_instruction=system_instruction if system_instruction else None
            )
            response = model.generate_content(
                prompt,
                generation_config=genai.GenerationConfig(
                    temperature=0.2,
                )
            )
            return response.text
        except Exception as e:
            logger.error(f"Gemini generation failure: {str(e)}")
            raise RuntimeError(f"AI intelligence engine failed: {str(e)}")

    @classmethod
    def generate_structured_json(cls, prompt: str, schema_template: Dict[str, Any], system_instruction: str = "") -> Dict[str, Any]:
        """
        Forces structural JSON schema response formats from Gemini.
        Parses results safely with dynamic programmatic fallbacks.
        """
        cls._initialize_sdk()
        if not cls._initialized:
            logger.error("GEMINI_API_KEY missing - falling back to template schema structures.")
            return schema_template

        schema_instruct = f"\nReturn ONLY valid, compliant JSON that strictly adheres to the following structural schema:\n{json.dumps(schema_template, indent=2)}"
        full_prompt = prompt + schema_instruct

        try:
            model = genai.GenerativeModel(
                model_name="gemini-2.5-flash",
                system_instruction=system_instruction if system_instruction else "You are a professional system reviewer. Return ONLY valid parsed JSON."
            )
            response = model.generate_content(
                full_prompt,
                generation_config=genai.GenerationConfig(
                    temperature=0.1,
                    response_mime_type="application/json"
                )
            )
            
            clean_text = response.text.strip()
            # Guard markdown wrapper tags
            if clean_text.startswith("```json"):
                clean_text = clean_text[7:]
            if clean_text.endswith("```"):
                clean_text = clean_text[:-3]
                
            return json.loads(clean_text)
        except Exception as e:
            logger.error(f"Structured JSON generation failed: {str(e)}. Compiling mock heuristic responses.")
            return schema_template
StreamClass = GeminiService
