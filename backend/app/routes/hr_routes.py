import json
import logging
from typing import Optional
from fastapi import APIRouter, File, Form, UploadFile, HTTPException
from pydantic import BaseModel
from app.services.llm_service import llm_service
from app.services.stt_service import stt_service
from app.services.analysis_service import analysis_service
from app.storage.session_store import session_store

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/hr", tags=["HR Interview"])

class HRQuestionRequest(BaseModel):
    category: Optional[str] = "behavioral"  # behavioral, situational, strengths_weaknesses, team, career_goals, all
    custom_topic: Optional[str] = None

@router.post("/generate-question")
async def generate_hr_question(request: HRQuestionRequest):
    category = request.category or "behavioral"
    prompt = f"""
You are an HR Director conducting campus placement interviews for major tech firms and Fortune 500 companies.
Generate a realistic, insightful HR interview question.
Category: {category}
{f'Additional focus: {request.custom_topic}' if request.custom_topic else ''}

Return a valid JSON object with EXACTLY this structure:
{{
  "question": "The interview question (e.g. 'Tell me about a time when you had a severe conflict with a team member during a project. How did you handle it?')",
  "category": "{category}",
  "intent": "Why HR interviewers ask this question (what qualities they are testing)",
  "star_framework_guide": {{
    "situation": "Set the context and background briefly",
    "task": "Explain your specific duty or responsibility",
    "action": "Detail the concrete actions YOU personally took (the most important part)",
    "result": "Quantifiable outcomes, lessons learned, and positive impact"
  }},
  "pitfalls_to_avoid": [
    "Blaming others or speaking negatively about teammates",
    "Speaking in generalities without giving a specific real-world story"
  ],
    "pro_tips": [
    "Use 'I' instead of 'We' when describing actions",
    "Keep the situation under 30 seconds so you can spend 60% of your time on Action and Result"
  ],
  "model_spoken_answer": "A complete, articulate spoken answer (120-180 words) following the STAR format that sounds natural and conversational, which the student can practice reading aloud to overcome speaking anxiety."
}}
"""
    messages = [
        {"role": "system", "content": "You are a professional HR interviewer. Output valid JSON only."},
        {"role": "user", "content": prompt}
    ]

    try:
        data = llm_service.chat_json(messages, temperature=0.7)
        return {"success": True, "data": data}
    except Exception as e:
        logger.warning(f"Using fallback HR question: {e}")
        fallback_data = {
            "question": "Tell me about a time when you faced a difficult deadline or high-pressure obstacle in a project. How did you prioritize and deliver?",
            "category": category,
            "intent": "Assesses resilience, time-management, prioritization skills, and composure under pressure.",
            "star_framework_guide": {
                "situation": "Briefly mention the project and the tight deadline.",
                "task": "Specify what deliverable was at stake.",
                "action": "Explain how you broke down tasks, communicated with stakeholders, and executed.",
                "result": "Share the successful completion, performance metrics, or what you learned."
            },
            "pitfalls_to_avoid": [
                "Claiming you never feel stress or have never faced a problem.",
                "Rambling about background details instead of your action."
            ],
            "pro_tips": [
                "Quantify your results (e.g. 'delivered 1 day early', 'maintained 99% accuracy').",
                "Highlight emotional maturity and structured thinking."
            ],
            "model_spoken_answer": "During my final semester team project, we faced a major crisis when a key module integration failed just 48 hours before our campus project submission deadline. As the backend lead, my responsibility was to diagnose the failure without delaying the team. I immediately organized a 15-minute triage with my teammates, isolated the breaking API endpoint, and decided to decouple the non-essential telemetry features. I then refactored the core data parsing logic using asynchronous handlers. By staying calm and systematically prioritizing core functionality, we resolved the blocker, ran end-to-end testing, and submitted the project 6 hours ahead of the final cutoff, receiving the top grade in our department. This experience taught me how structured prioritization and calm communication turn obstacles into successes."
        }
        return {"success": True, "data": fallback_data}

class GenerateHRAnswerRequest(BaseModel):
    question: str
    category: Optional[str] = "behavioral"

@router.post("/generate-answer")
async def generate_hr_answer(request: GenerateHRAnswerRequest):
    """Generates an ideal STAR framework spoken answer for an HR question."""
    prompt = f"""
Write an outstanding, conversational, and authentic spoken answer for an Indian campus placement HR interview.
Question: "{request.question}"
Category: {request.category}

Requirements:
- Speak as a high-potential, humble, and articulate fresh graduate.
- Clearly embody the STAR framework (Situation -> Task -> Action -> Result) without mechanically saying the letters S, T, A, R.
- Length: approximately 130-180 words (around 1 to 1.5 minutes speaking).
- Authentic, confident, and positive tone.

Return valid JSON:
{{
  "sample_answer": "The full spoken answer...",
  "star_breakdown": {{
    "situation": "Brief context",
    "task": "Specific responsibility",
    "action": "What you did",
    "result": "Measurable positive outcome"
  }},
  "delivery_advice": "Advice on tone, body language, and pacing"
}}
"""
    messages = [
        {"role": "system", "content": "You are a senior HR director and interview coach. Output valid JSON only."},
        {"role": "user", "content": prompt}
    ]
    try:
        data = llm_service.chat_json(messages, temperature=0.6)
        return {"success": True, "data": data}
    except Exception as e:
        logger.error(f"Error generating HR answer: {e}")
        return {
            "success": True,
            "data": {
                "sample_answer": f"In a recent college project, we were tasked with delivering an application on a very tight timeline. I took ownership of structuring our milestones, worked closely with my team members to eliminate bottlenecks, and tested our solution rigorously. As a result, we delivered the project ahead of schedule with zero critical defects, learning how vital proactive communication is in delivering excellence.",
                "delivery_advice": "Speak with a warm smile, maintain eye contact, and emphasize the positive result."
            }
        }

@router.post("/analyze")
async def analyze_hr_response(
    audio: Optional[UploadFile] = File(None),
    fallback_transcript: Optional[str] = Form(""),
    question: str = Form(...),
    category: Optional[str] = Form("behavioral"),
    duration_seconds: float = Form(0.0),
):
    transcript = ""
    stt_provider = "none"

    # Step 1: Groq Whisper STT
    if audio is not None:
        try:
            audio_bytes = await audio.read()
            if len(audio_bytes) > 100:
                stt_res = stt_service.transcribe_audio(audio_bytes, filename=audio.filename or "hr_answer.webm")
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
            detail="No transcript detected. Please speak into the microphone."
        )

    # Step 3: Analysis
    context = {"question": question, "category": category}
    analysis = analysis_service.evaluate_response(
        transcript=transcript,
        mode="hr",
        context=context,
        duration_seconds=duration_seconds,
    )
    analysis["stt_provider"] = stt_provider

    # Step 4: Save session
    session_payload = {
        "mode": "hr",
        "title": question,
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
