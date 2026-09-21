import json
import logging
import re
from typing import Dict, Any, List, Optional
from groq import Groq
from app.config import get_groq_api_key, get_llm_model, get_llm_fallback_model

logger = logging.getLogger(__name__)

class LLMService:
    def __init__(self):
        self._cached_key = None
        self._client = None

    def get_client(self) -> Optional[Groq]:
        key = get_groq_api_key()
        if not key or key == "your_groq_api_key_here":
            return None
        if self._client is None or self._cached_key != key:
            self._cached_key = key
            self._client = Groq(api_key=key)
        return self._client

    def is_configured(self) -> bool:
        key = get_groq_api_key()
        return bool(key and key != "your_groq_api_key_here")

    def chat_completion(
        self,
        messages: List[Dict[str, str]],
        json_mode: bool = False,
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> str:
        client = self.get_client()
        if not client:
            raise ValueError("Groq API key not configured. Please add GROQ_API_KEY to your backend/.env file.")

        primary_model = get_llm_model()
        fallback_model = get_llm_fallback_model()

        models_to_try = [primary_model]
        if fallback_model and fallback_model != primary_model:
            models_to_try.append(fallback_model)
        if "llama-3.3-70b-versatile" not in models_to_try:
            models_to_try.append("llama-3.3-70b-versatile")

        last_error = None
        for model in models_to_try:
            try:
                logger.info(f"Invoking LLM with model: {model}")
                params: Dict[str, Any] = {
                    "messages": messages,
                    "model": model,
                    "temperature": temperature,
                    "max_tokens": max_tokens,
                }
                if json_mode:
                    params["response_format"] = {"type": "json_object"}

                response = client.chat.completions.create(**params)
                return response.choices[0].message.content or ""
            except Exception as e:
                logger.warning(f"Failed with model {model}: {e}")
                last_error = e

        raise RuntimeError(f"All LLM models failed. Last error: {last_error}")

    def chat_json(self, messages: List[Dict[str, str]], temperature: float = 0.5) -> Dict[str, Any]:
        """Calls LLM and guarantees parsed JSON output."""
        raw_text = self.chat_completion(messages, json_mode=True, temperature=temperature)
        return self.extract_json(raw_text)

    @staticmethod
    def extract_json(text: str) -> Dict[str, Any]:
        """Extracts and parses JSON from text, handling markdown fences and formatting quirks."""
        text = text.strip()
        # Direct parse attempt
        try:
            return json.loads(text)
        except Exception:
            pass

        # Check for ```json ... ``` or ``` ... ```
        pattern = r"```(?:json)?\s*([\s\S]*?)\s*```"
        match = re.search(pattern, text)
        if match:
            try:
                return json.loads(match.group(1).strip())
            except Exception:
                pass

        # Try finding outer braces { ... }
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1 and end > start:
            try:
                return json.loads(text[start : end + 1])
            except Exception:
                pass

        raise ValueError(f"Could not parse valid JSON from LLM response: {text[:200]}...")

llm_service = LLMService()
