import io
import logging
from typing import Dict, Any, Optional
from groq import Groq
from app.config import get_groq_api_key, get_whisper_model

logger = logging.getLogger(__name__)

class STTService:
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

    def transcribe_audio(self, audio_bytes: bytes, filename: str = "recording.webm") -> Dict[str, Any]:
        """
        Transcribes audio using Groq Whisper API.
        Returns dict with:
        - text: transcribed string
        - language: detected language (if provided)
        - duration: approximate duration
        """
        client = self.get_client()
        if not client:
            raise ValueError("Groq API key not configured. Please add GROQ_API_KEY in backend/.env")

        whisper_model = get_whisper_model()
        try:
            file_obj = (filename, io.BytesIO(audio_bytes))

            transcription = client.audio.transcriptions.create(
                file=file_obj,
                model=whisper_model,
                response_format="verbose_json",
                temperature=0.0,
            )

            text = getattr(transcription, "text", "") or ""
            duration = getattr(transcription, "duration", 0.0) or 0.0
            language = getattr(transcription, "language", "en") or "en"

            return {
                "text": text.strip(),
                "duration": round(float(duration), 2),
                "language": language,
                "provider": "groq_whisper",
            }
        except Exception as e:
            logger.error(f"Groq Whisper transcription failed: {e}")
            raise RuntimeError(f"Speech-to-Text failed: {str(e)}")

stt_service = STTService()
