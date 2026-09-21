import re
import logging
from typing import Dict, Any, List, Optional
from app.services.llm_service import llm_service

logger = logging.getLogger(__name__)

COMMON_FILLERS = [
    "um", "uh", "er", "ah", "like", "actually", "basically",
    "you know", "literally", "sort of", "kind of", "i mean",
    "honestly", "right", "so yeah", "to be honest"
]

class AnalysisService:
    def analyze_lexical_patterns(self, text: str, duration_seconds: float = 0.0) -> Dict[str, Any]:
        """Detects filler words, repetition, and speech pace from transcript text."""
        clean_text = text.lower()
        words = re.findall(r"\b[a-zA-Z']+\b", clean_text)
        word_count = len(words)

        # Count filler words and phrases
        filler_breakdown: Dict[str, int] = {}
        total_fillers = 0

        for filler in COMMON_FILLERS:
            # Word boundary regex for multi-word or single-word fillers
            pattern = r"\b" + re.escape(filler) + r"\b"
            matches = len(re.findall(pattern, clean_text))
            if matches > 0:
                filler_breakdown[filler] = matches
                total_fillers += matches

        # Detect repeated bigrams / trigrams (common repetitions)
        phrases_count: Dict[str, int] = {}
        if len(words) >= 2:
            for i in range(len(words) - 1):
                phrase = f"{words[i]} {words[i+1]}"
                # Filter out standard stop words combinations
                if phrase not in [
                    "in the", "of the", "to the", "it is", "on the",
                    "and the", "at the", "for the", "with the", "this is",
                    "i am", "to be", "that is"
                ]:
                    phrases_count[phrase] = phrases_count.get(phrase, 0) + 1

        repeated_phrases = [
            phrase for phrase, count in phrases_count.items() if count >= 3
        ]

        # Calculate Speaking Pace (Words Per Minute)
        wpm = 0
        if duration_seconds > 5 and word_count > 0:
            wpm = round((word_count / duration_seconds) * 60)

        return {
            "word_count": word_count,
            "duration_seconds": round(duration_seconds, 1),
            "speaking_rate_wpm": wpm,
            "filler_words": {
                "total_count": total_fillers,
                "breakdown": filler_breakdown,
            },
            "repeated_phrases": repeated_phrases[:5],
        }

    def evaluate_response(
        self,
        transcript: str,
        mode: str,
        context: Dict[str, Any],
        duration_seconds: float = 0.0,
    ) -> Dict[str, Any]:
        """
        Full evaluation using LLM + rule-based lexical analysis.
        Mode: 'gd', 'hr', or 'resume'
        """
        lexical = self.analyze_lexical_patterns(transcript, duration_seconds)

        if not transcript or len(transcript.strip().split()) < 3:
            return {
                "scores": {
                    "overall": 0,
                    "fluency": 0,
                    "grammar": 0,
                    "vocabulary": 0,
                    "relevance": 0,
                    "structure": 0,
                },
                "filler_words": lexical["filler_words"],
                "repeated_phrases": lexical["repeated_phrases"],
                "duration_seconds": duration_seconds,
                "speaking_rate_wpm": 0,
                "feedback": {
                    "summary": "No speech or very short speech detected. Please speak clearly for at least 30-60 seconds.",
                    "strengths": [],
                    "weaknesses": ["Answer too short to evaluate properly"],
                    "actionable_tips": ["Speak louder and provide a full complete answer."],
                },
                "star_analysis": None,
                "improved_answer_sample": "",
            }

        # Build prompt based on mode
        prompt = self._build_evaluation_prompt(transcript, mode, context, lexical)

        messages = [
            {
                "role": "system",
                "content": (
                    "You are an expert communication coach and placement interviewer evaluating a college student "
                    "for campus placements (Group Discussions, HR interviews, and Resume-based technical rounds). "
                    "Be constructive, encouraging, but rigorous and accurate with scores (0 to 100). "
                    "You MUST respond ONLY with a valid JSON object matching the requested schema."
                ),
            },
            {"role": "user", "content": prompt},
        ]

        try:
            analysis_result = llm_service.chat_json(messages, temperature=0.3)
        except Exception as e:
            logger.error(f"LLM analysis failed: {e}")
            # Fallback estimation if API fails
            analysis_result = self._generate_fallback_analysis(transcript, lexical, mode)

        # Merge lexical results
        scores = analysis_result.get("scores", {})
        # Ensure all score components exist
        fluency = int(scores.get("fluency", 70))
        grammar = int(scores.get("grammar", 70))
        vocab = int(scores.get("vocabulary", 70))
        relevance = int(scores.get("relevance", 70))
        structure = int(scores.get("structure", 70))

        overall = scores.get("overall")
        if not overall:
            overall = round((fluency + grammar + vocab + relevance + structure) / 5)

        return {
            "transcript": transcript,
            "scores": {
                "overall": overall,
                "fluency": fluency,
                "grammar": grammar,
                "vocabulary": vocab,
                "relevance": relevance,
                "structure": structure,
            },
            "filler_words": lexical["filler_words"],
            "repeated_phrases": lexical["repeated_phrases"],
            "duration_seconds": lexical["duration_seconds"],
            "speaking_rate_wpm": lexical["speaking_rate_wpm"],
            "star_analysis": analysis_result.get("star_analysis"),
            "feedback": analysis_result.get("feedback", {
                "summary": "Good effort. Focus on structuring ideas with clear examples.",
                "strengths": ["Clear voice", "Relevant topic points"],
                "weaknesses": ["Needs stronger concluding remarks"],
                "actionable_tips": ["Structure with Introduction, Body, Conclusion"],
            }),
            "improved_answer_sample": analysis_result.get("improved_answer_sample", ""),
        }

    def _build_evaluation_prompt(
        self,
        transcript: str,
        mode: str,
        context: Dict[str, Any],
        lexical: Dict[str, Any],
    ) -> str:
        prompt_lines = [
            f"EVALUATION TASK: Analyze this spoken response for a {mode.upper()} round.",
            f"Transcript: \"{transcript}\"",
            f"Word count: {lexical['word_count']} words",
            f"Duration: {lexical['duration_seconds']} seconds (Speaking rate: {lexical['speaking_rate_wpm']} WPM)",
            f"Detected Fillers: {lexical['filler_words']['total_count']} (Breakdown: {lexical['filler_words']['breakdown']})",
        ]

        if mode == "gd":
            topic = context.get("topic", "General Discussion")
            prompt_lines.append(f"GD Topic: \"{topic}\"")
            prompt_lines.append(
                "Evaluate for Group Discussion: did the speaker state a clear stance, provide reasoned arguments/examples, maintain professional vocabulary, and conclude effectively?"
            )
        elif mode == "hr":
            question = context.get("question", "Tell me about yourself")
            category = context.get("category", "behavioral")
            prompt_lines.append(f"HR Question: \"{question}\" (Category: {category})")
            prompt_lines.append(
                "Evaluate for HR Interview: check if the response is professional, confident, and whether behavioral questions follow the STAR framework (Situation, Task, Action, Result)."
            )
        elif mode == "resume":
            question = context.get("question", "Explain your project")
            project_or_skill = context.get("topic", "Resume Project/Skill")
            prompt_lines.append(f"Resume Question: \"{question}\" relating to: {project_or_skill}")
            prompt_lines.append(
                "Evaluate for Resume-Based Technical Interview: depth of technical explanation, ownership, problem-solving ability, and clarity of personal contribution."
            )

        prompt_lines.append("""
Return a single JSON object with EXACTLY this structure:
{
  "scores": {
    "overall": 0-100,
    "fluency": 0-100,
    "grammar": 0-100,
    "vocabulary": 0-100,
    "relevance": 0-100,
    "structure": 0-100
  },
  "star_analysis": {
    "applicable": true or false,
    "situation_present": true or false,
    "task_present": true or false,
    "action_present": true or false,
    "result_present": true or false,
    "assessment": "Short assessment of how well STAR was utilized"
  },
  "feedback": {
    "summary": "2-3 sentences overview of the candidate's performance",
    "strengths": ["Specific strength 1", "Specific strength 2"],
    "weaknesses": ["Specific weakness 1 (e.g. filler words, weak conclusion, missing metrics)", "Specific weakness 2"],
    "actionable_tips": ["Practical step to improve for next attempt", "Another actionable tip"]
  },
  "improved_answer_sample": "An upgraded, polished version of candidate's answer showing how a top candidate would phrase it naturally."
}
""")
        return "\n".join(prompt_lines)

    def _generate_fallback_analysis(
        self, transcript: str, lexical: Dict[str, Any], mode: str
    ) -> Dict[str, Any]:
        """Simple baseline analysis when LLM is offline or unconfigured."""
        wc = lexical["word_count"]
        fillers = lexical["filler_words"]["total_count"]
        # Basic heuristic
        base_score = min(85, max(50, int(55 + (wc / 2) - (fillers * 3))))
        return {
            "scores": {
                "overall": base_score,
                "fluency": max(45, min(90, base_score - fillers * 2)),
                "grammar": 75,
                "vocabulary": 72,
                "relevance": 80,
                "structure": 70,
            },
            "star_analysis": {
                "applicable": mode == "hr",
                "situation_present": True,
                "task_present": True,
                "action_present": False,
                "result_present": False,
                "assessment": "Ensure you clearly describe the Action you took and measurable Results.",
            },
            "feedback": {
                "summary": "Good effort. Your speaking rate was clear, but work on reducing filler words and giving more structured examples.",
                "strengths": ["Clear audible delivery", "Kept answer relevant"],
                "weaknesses": [
                    f"Used {fillers} filler words ({', '.join(lexical['filler_words']['breakdown'].keys()) or 'none'})",
                    "Could use stronger conclusion"
                ],
                "actionable_tips": [
                    "Pause silently for a second instead of saying 'um' or 'like'",
                    "Structure your answer into 3 key bullet points"
                ],
            },
            "improved_answer_sample": f"Here is a structured example: 'To begin with, {transcript[:100]}... In conclusion, this experience demonstrated key problem-solving skills.'",
        }

analysis_service = AnalysisService()
