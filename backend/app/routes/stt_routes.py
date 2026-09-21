import logging
from fastapi import APIRouter, File, UploadFile, HTTPException
from app.services.stt_service import stt_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/stt", tags=["Speech to Text"])

@router.post("/transcribe")
async def transcribe_audio_file(audio: UploadFile = File(...)):
    """Transcribes an uploaded audio recording using Groq Whisper."""
    try:
        content = await audio.read()
        if len(content) < 100:
            raise HTTPException(status_code=400, detail="Audio file is too short or empty.")

        res = stt_service.transcribe_audio(content, filename=audio.filename or "speech.webm")
        return {
            "success": True,
            "text": res.get("text", "").strip(),
            "duration": res.get("duration", 0.0),
            "language": res.get("language", "en"),
            "provider": res.get("provider", "groq_whisper"),
        }
    except Exception as e:
        logger.error(f"Transcription error: {e}")
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")
