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
router = APIRouter(prefix="/api/gd", tags=["Group Discussion"])

class TopicRequest(BaseModel):
    category: Optional[str] = "trending"  # technology, economy, social, campus, trending
    custom_prompt: Optional[str] = None

@router.post("/generate-topic")
async def generate_gd_topic(request: TopicRequest):
    category = request.category or "trending"
    prompt = f"""
Generate a realistic, thought-provoking Group Discussion (GD) topic for campus placement rounds.
Category requested: {category}
{f'Custom direction: {request.custom_prompt}' if request.custom_prompt else ''}

Return a valid JSON object with EXACTLY this structure:
{{
  "topic": "The exact GD topic statement (e.g. 'Will Artificial Intelligence reduce job opportunities for fresh engineering graduates?')",
  "category": "{category}",
  "explanation": "A concise 2-3 sentence overview explaining why this topic is currently relevant and hotly debated.",
  "arguments_for": [
    "Compelling point supporting one perspective with reasoning",
    "Second key point with practical real-world context",
    "Third supporting point"
  ],
  "arguments_against": [
    "Counterpoint explaining the other perspective",
    "Second counter-argument addressing nuances",
    "Third counter-argument"
  ],
  "power_vocabulary": [
    {{"word": "Disruption", "meaning": "Radical change in an industry"}},
    {{"word": "Augmentation", "meaning": "Enhancing rather than replacing human capacity"}},
    {{"word": "Paradigm Shift", "meaning": "A fundamental change in approach or underlying assumptions"}},
    {{"word": "Obsolescence", "meaning": "The process of becoming outdated or no longer useful"}}
  ],
  "opening_points": [
    "A strong hook or factual stat to start the discussion confidently",
    "A balanced framing statement to initiate consensus"
  ],
  "closing_points": [
    "A constructive synthesis acknowledging both viewpoints",
    "A future-oriented final takeaway"
  ],
  "model_spoken_speech": "A complete, articulate, and conversational 1.5-minute spoken speech (around 150-200 words) that the student can practice reading aloud to overcome speaking anxiety. It should include a friendly opening greeting, two well-reasoned points with concrete examples, and a constructive conclusion."
}}
"""
    messages = [
        {"role": "system", "content": "You are a senior placement GD trainer. Output valid JSON only."},
        {"role": "user", "content": prompt}
    ]

    try:
        topic_data = llm_service.chat_json(messages, temperature=0.7)
        return {"success": True, "data": topic_data}
    except Exception as e:
        logger.warning(f"Using fallback GD topic due to: {e}")
        # Curated fallback
        fallback_topic = {
            "topic": "Will Artificial Intelligence reduce job opportunities for fresh graduates?",
            "category": category,
            "explanation": "With rapid advancements in generative AI and automated coding tools, companies are restructuring entry-level roles, raising questions about traditional campus hiring.",
            "arguments_for": [
                "Routine entry-level coding, testing, and documentation can be largely automated by AI agents.",
                "Startups and enterprises are doing more work with smaller, senior-heavy engineering teams.",
                "The bar for entry-level problem solving has risen drastically."
            ],
            "arguments_against": [
                "AI creates new roles in prompt engineering, AI safety, fine-tuning, and domain integration.",
                "Human empathy, team communication, and strategic problem decomposition cannot be automated.",
                "Engineers who harness AI tools are significantly more productive, driving new software demand."
            ],
            "power_vocabulary": [
                {"word": "Augmentation", "meaning": "Enhancing human capability rather than replacing it"},
                {"word": "Disruption", "meaning": "Disturbance that fundamentally alters an established market"},
                {"word": "Cognitive Agility", "meaning": "The ability to rapidly adapt to new conceptual challenges"}
            ],
            "opening_points": [
                "Good morning everyone. The question before us is not whether AI will take jobs, but how our roles as fresh graduates will evolve alongside it.",
                "According to recent industry forecasts, 80% of routine technical tasks will be augmented by AI within 3 years."
            ],
            "closing_points": [
                "In conclusion, while AI may eliminate repetitive tasks, it elevates the value of continuous learning, architectural thinking, and emotional intelligence.",
                "Fresh graduates who treat AI as a partner rather than a competitor will find unprecedented opportunities."
            ],
            "model_spoken_speech": "Good morning everyone. Thank you for this opportunity. The topic before us is whether Artificial Intelligence will reduce job opportunities for fresh graduates. In my perspective, AI represents an era of augmentation rather than outright replacement. Repetitive tasks like basic boilerplate coding and automated test writing are certainly being taken over by AI. However, this raises the creative bar for us as engineers. Companies today aren't simply looking for syntax typers; they are looking for problem solvers who can design resilient architectures, understand business requirements, and leverage AI tools to multiply their output. In conclusion, while legacy roles may evolve, fresh graduates who build adaptability and strong foundational skills will find immense opportunities in this AI-driven landscape. Thank you."
        }
        return {"success": True, "data": fallback_topic}

class GenerateAnswerRequest(BaseModel):
    topic: str

@router.post("/generate-answer")
async def generate_gd_answer(request: GenerateAnswerRequest):
    """Generates a complete, ready-to-speak GD speech for the candidate to practice."""
    prompt = f"""
Write a complete, articulate, and natural 1.5-minute spoken speech for a college student in a campus placement Group Discussion.
Topic: "{request.topic}"

Requirements:
- Professional, confident, and conversational tone (not overly formal, avoid robotic jargon)
- Structure: Polite opening greeting -> Clear stance -> 2 balanced arguments with real-life context -> Smooth concluding summary
- Length: approximately 150-200 words (ideal for 1.5 minutes of steady speaking)

Return valid JSON:
{{
  "sample_answer": "The full spoken speech...",
  "speaking_tips": ["Tip on vocal pace", "Tip on eye contact and tone"]
}}
"""
    messages = [
        {"role": "system", "content": "You are a communication and placement coach. Output valid JSON only."},
        {"role": "user", "content": prompt}
    ]
    try:
        data = llm_service.chat_json(messages, temperature=0.6)
        return {"success": True, "data": data}
    except Exception as e:
        logger.error(f"Error generating GD answer: {e}")
        return {
            "success": True,
            "data": {
                "sample_answer": f"Good morning everyone. When discussing '{request.topic}', I believe we must analyze both technological progress and human adaptability. While automation handles routine tasks, our capability to think critically, communicate effectively, and synthesize complex ideas remains irreplaceable. Therefore, by focusing on continuous learning and practical application, fresh graduates can turn this technological shift into a distinct advantage. Thank you.",
                "speaking_tips": ["Pause slightly before moving between points", "Speak at a steady 130 words-per-minute pace"]
            }
        }

@router.post("/analyze")
async def analyze_gd_response(
    audio: Optional[UploadFile] = File(None),
    fallback_transcript: Optional[str] = Form(""),
    topic: str = Form(...),
    duration_seconds: float = Form(0.0),
):
    """
    Accepts audio file (primary STT via Groq Whisper) or fallback transcript (Web Speech API).
    If Groq Whisper fails, automatically falls back to browser's Web Speech API transcript!
    """
    transcript = ""
    stt_provider = "none"

    # Step 1: Try primary STT (Groq Whisper) if audio is provided
    if audio is not None:
        try:
            audio_bytes = await audio.read()
            if len(audio_bytes) > 100:  # Valid audio payload
                stt_res = stt_service.transcribe_audio(audio_bytes, filename=audio.filename or "gd_speech.webm")
                transcript = stt_res.get("text", "").strip()
                stt_provider = "groq_whisper"
                if not duration_seconds or duration_seconds <= 0:
                    duration_seconds = stt_res.get("duration", 0.0)
        except Exception as e:
            logger.warning(f"Groq Whisper failed ({e}), falling back to client Web Speech transcript")

    # Step 2: Fallback to Option B (browser Web Speech transcript) if transcript is empty
    if not transcript and fallback_transcript:
        transcript = fallback_transcript.strip()
        stt_provider = "web_speech_api_fallback"

    if not transcript:
        raise HTTPException(
            status_code=400,
            detail="No transcript could be obtained. Please ensure your microphone is working or speaking is detected."
        )

    # Step 3: Run comprehensive evaluation
    context = {"topic": topic}
    analysis = analysis_service.evaluate_response(
        transcript=transcript,
        mode="gd",
        context=context,
        duration_seconds=duration_seconds,
    )
    analysis["stt_provider"] = stt_provider

    # Step 4: Persist in session store
    session_payload = {
        "mode": "gd",
        "title": topic,
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
