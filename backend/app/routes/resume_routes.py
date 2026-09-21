import json
import logging
from typing import Optional
from fastapi import APIRouter, File, Form, UploadFile, HTTPException
from pydantic import BaseModel
from app.services.stt_service import stt_service
from app.services.resume_service import resume_service
from app.services.analysis_service import analysis_service
from app.storage.session_store import session_store

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/resume", tags=["Resume Interview"])

class QuestionGenRequest(BaseModel):
    count: Optional[int] = 5

@router.post("/upload")
async def upload_resume(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF resumes are supported.")

    content = await file.read()
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Uploaded PDF file is empty.")

    try:
        parsed_data = resume_service.parse_resume(content, filename=file.filename)
        return {"success": True, "resume": parsed_data}
    except Exception as e:
        logger.error(f"Resume parsing error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to parse resume: {str(e)}")

@router.get("/current")
async def get_current_resume():
    if not resume_service.current_parsed_resume:
        return {"has_resume": False, "resume": None}
    return {"has_resume": True, "resume": resume_service.current_parsed_resume}

@router.post("/generate-questions")
async def generate_resume_questions(request: QuestionGenRequest = QuestionGenRequest()):
    try:
        questions = resume_service.generate_interview_questions(count=request.count or 5)
        return {"success": True, "questions": questions}
    except Exception as e:
        logger.error(f"Error generating questions: {e}")
        raise HTTPException(status_code=400, detail=str(e))

class GenerateResumeAnswerRequest(BaseModel):
    question: str
    topic: Optional[str] = "Technical Project"

@router.post("/generate-answer")
async def generate_resume_answer(request: GenerateResumeAnswerRequest):
    """Generates an ideal spoken technical response to a resume interview question."""
    prompt = f"""
Write an articulate, confident, and concrete spoken response for a campus technical interview question based on the candidate's project or skill.
Question: "{request.question}"
Topic/Project: "{request.topic}"

Requirements:
- First-person, authentic tone ("In my project...", "I designed...", "The trade-off was...").
- Highlight problem-solving, architectural choices, and measurable results.
- Length: approximately 120-170 words (ideal for 1 to 1.5 minutes speaking).

Return valid JSON:
{{
  "sample_answer": "The full spoken answer...",
  "key_takeaways": ["Point 1", "Point 2"]
}}
"""
    from app.services.llm_service import llm_service
    messages = [
        {"role": "system", "content": "You are a senior tech lead and placement interviewer. Output valid JSON only."},
        {"role": "user", "content": prompt}
    ]
    try:
        data = llm_service.chat_json(messages, temperature=0.6)
        return {"success": True, "data": data}
    except Exception as e:
        logger.error(f"Error generating resume answer: {e}")
        return {
            "success": True,
            "data": {
                "sample_answer": f"For {request.topic}, I designed a clean, modular architecture to handle the requirements reliably. When implementing this, I evaluated different approaches and chose the stack that prioritized maintainability and performance. One critical challenge was optimizing data throughput, which I solved through efficient querying and clean state separation. Overall, this project deepened my practical engineering skills.",
                "key_takeaways": ["Emphasize architectural rationale", "Explain how you debugged obstacles"]
            }
        }

@router.post("/analyze")
async def analyze_resume_answer(
    audio: Optional[UploadFile] = File(None),
    fallback_transcript: Optional[str] = Form(""),
    question: str = Form(...),
    topic: Optional[str] = Form("Resume Technical Discussion"),
    duration_seconds: float = Form(0.0),
):
    transcript = ""
    stt_provider = "none"

    # Step 1: Groq Whisper STT
    if audio is not None:
        try:
            audio_bytes = await audio.read()
            if len(audio_bytes) > 100:
                stt_res = stt_service.transcribe_audio(audio_bytes, filename=audio.filename or "resume_answer.webm")
                transcript = stt_res.get("text", "").strip()
                stt_provider = "groq_whisper"
                if not duration_seconds or duration_seconds <= 0:
                    duration_seconds = stt_res.get("duration", 0.0)
        except Exception as e:
            logger.warning(f"Groq Whisper failed ({e}), falling back to Web Speech transcript")

    # Step 2: Fallback to Web Speech API
    if not transcript and fallback_transcript:
        transcript = fallback_transcript.strip()
        stt_provider = "web_speech_api_fallback"

    if not transcript:
        raise HTTPException(
            status_code=400,
            detail="No transcript detected. Please answer through microphone or verify your speech."
        )

    # Step 3: Analysis
    context = {"question": question, "topic": topic}
    analysis = analysis_service.evaluate_response(
        transcript=transcript,
        mode="resume",
        context=context,
        duration_seconds=duration_seconds,
    )
    analysis["stt_provider"] = stt_provider

    # Step 4: Save session
    session_payload = {
        "mode": "resume",
        "title": f"Resume: {question}",
        "question_context": context,
        "transcript": transcript,
        "duration_seconds": duration_seconds,
        "stt_provider": stt_provider,
        "scores": analysis["scores"],
        "filler_words": analysis["filler_words"],
        "repeated_phrases": analysis["repeated_phrases"],
        "star_analysis": analysis.get("star_analysis"),
        "feedback": analysis["feedback"],
        "improved_answer_sample": analysis.get("improved_answer_sample", ""),
    }
    saved = session_store.save_session(session_payload)

    return {"success": True, "session_id": saved["id"], "analysis": analysis}
