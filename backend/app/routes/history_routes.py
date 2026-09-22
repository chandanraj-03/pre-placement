import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from app.storage.session_store import session_store
from app.services.llm_service import llm_service
from app.config import get_llm_model, get_groq_api_key

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/history", tags=["Session History & Analytics"])

@router.get("/sessions")
async def get_sessions(
    limit: int = Query(50, ge=1, le=200),
    mode: Optional[str] = Query(None)
):
    sessions = session_store.list_sessions(limit=limit, mode=mode)
    return {"success": True, "count": len(sessions), "sessions": sessions}

@router.get("/session/{session_id}")
async def get_session_detail(session_id: str):
    session = session_store.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"success": True, "session": session}

@router.delete("/session/{session_id}")
async def delete_session(session_id: str):
    deleted = session_store.delete_session(session_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Session not found or already deleted")
    return {"success": True, "message": "Session removed successfully"}

@router.post("/reset-all")
async def reset_all_stored_data():
    """Deletes temporary practice session JSON files and parsed resumes from local disk.
    NOTE: Stored study notes (backend/data/notes.json) are strictly preserved and NEVER erased."""
    from app.services.resume_service import resume_service
    deleted_sessions = session_store.clear_all_sessions()
    deleted_resumes = resume_service.clear_all_resumes()
    return {
        "success": True,
        "message": "Temporary session and resume data reset. User notes remain safely preserved.",
        "deleted_sessions_count": deleted_sessions,
        "deleted_resumes_count": deleted_resumes,
    }

@router.get("/analytics")
async def get_analytics():
    analytics = session_store.get_progress_analytics()
    return {"success": True, "analytics": analytics}

@router.get("/config-status")
async def get_config_status():
    is_key_set = llm_service.is_configured()
    groq_key = get_groq_api_key()
    masked_key = ""
    if is_key_set and groq_key:
        masked_key = groq_key[:4] + "..." + groq_key[-4:] if len(groq_key) > 8 else "***"

    return {
        "success": True,
        "is_configured": is_key_set,
        "masked_key": masked_key,
        "active_model": get_llm_model(),
    }

from pydantic import BaseModel

class SetGroqKeyPayload(BaseModel):
    groq_api_key: str

@router.post("/set-groq-key")
async def set_groq_key_endpoint(payload: SetGroqKeyPayload):
    """Configures and tests a new Groq API key dynamically without restarting the server."""
    key = payload.groq_api_key.strip()
    if not key or not key.startswith("gsk_"):
        raise HTTPException(
            status_code=400,
            detail="Invalid Groq API key format. A valid Groq key starts with 'gsk_'"
        )

    # Test key validity with a lightweight call to Groq API
    from groq import Groq
    try:
        test_client = Groq(api_key=key)
        test_client.models.list()
    except Exception as e:
        logger.warning(f"Groq API key test failed: {e}")
        raise HTTPException(
            status_code=400,
            detail=f"Groq rejected this API key: {str(e)}"
        )

    from app.config import set_groq_api_key
    set_groq_api_key(key)
    llm_service._cached_key = None
    llm_service._client = None
    from app.services.stt_service import stt_service
    stt_service._cached_key = None
    stt_service._client = None

    masked = key[:4] + "..." + key[-4:] if len(key) > 8 else "***"
    return {
        "success": True,
        "message": "Groq API key verified and saved successfully!",
        "masked_key": masked,
        "is_configured": True,
        "active_model": get_llm_model(),
    }

