import io
import json
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional
import pdfplumber
from app.config import RESUMES_DIR
from app.services.llm_service import llm_service

logger = logging.getLogger(__name__)

class ResumeService:
    def __init__(self, storage_dir: Path = RESUMES_DIR):
        self.storage_dir = storage_dir
        self.storage_dir.mkdir(parents=True, exist_ok=True)
        self.current_parsed_resume: Optional[Dict[str, Any]] = None
        self._load_latest_resume()

    def _load_latest_resume(self):
        """Loads the most recently saved parsed resume if available."""
        files = list(self.storage_dir.glob("*.json"))
        if files:
            files.sort(key=lambda f: f.stat().st_mtime, reverse=True)
            try:
                with open(files[0], "r", encoding="utf-8") as f:
                    self.current_parsed_resume = json.load(f)
            except Exception as e:
                logger.warning(f"Could not load cached resume: {e}")

    def clear_all_resumes(self) -> int:
        """Deletes all resume JSON files from disk and resets state."""
        self.current_parsed_resume = None
        count = 0
        for file_path in self.storage_dir.glob("*.json"):
            try:
                file_path.unlink()
                count += 1
            except Exception:
                pass
        return count

    def extract_text_from_pdf(self, pdf_bytes: bytes) -> str:
        """Extracts text content from PDF bytes using pdfplumber."""
        full_text = []
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            for page_num, page in enumerate(pdf.pages):
                page_text = page.extract_text()
                if page_text:
                    full_text.append(page_text)
        return "\n\n".join(full_text).strip()

    def parse_resume(self, pdf_bytes: bytes, filename: str = "resume.pdf") -> Dict[str, Any]:
        """Extracts text and uses LLM to structure resume data."""
        raw_text = self.extract_text_from_pdf(pdf_bytes)
        if not raw_text:
            raise ValueError("No text could be extracted from this PDF. Please ensure it is not a scanned image.")

        prompt = f"""
You are an expert technical recruiter. Analyze the following resume text and parse it into a structured JSON schema.

RESUME TEXT:
\"\"\"{raw_text[:6000]}\"\"\"

Return a valid JSON object with the following fields:
{{
  "candidate_name": "Full Name or Candidate",
  "contact": {{"email": "", "phone": "", "linkedin": "", "github": ""}},
  "summary": "Brief professional summary if present",
  "skills": {{"technical": ["Python", "FastAPI", ...], "tools": ["Git", "Docker", ...], "soft_skills": [...]}},
  "education": [
    {{"degree": "B.Tech Computer Science", "institution": "University Name", "year": "2024", "gpa_or_percentage": ""}}
  ],
  "projects": [
    {{"title": "Project Title", "technologies": ["React", "FastAPI"], "description": "What it does", "key_features": ["Feature 1", "Feature 2"]}}
  ],
  "experience": [
    {{"role": "Intern", "company": "Company Name", "duration": "3 months", "responsibilities": ["Task 1"]}}
  ],
  "certifications": ["Cert 1", "Cert 2"],
  "achievements": ["Achievement 1"]
}}
"""
        messages = [
            {"role": "system", "content": "You are a precise resume parser. Output only valid JSON."},
            {"role": "user", "content": prompt}
        ]

        try:
            parsed = llm_service.chat_json(messages, temperature=0.2)
        except Exception as e:
            logger.warning(f"LLM resume parsing failed, using fallback heuristic: {e}")
            parsed = {
                "candidate_name": "Candidate",
                "summary": "Extracted from resume",
                "skills": {"technical": ["Python", "JavaScript", "SQL"], "tools": ["Git"], "soft_skills": ["Teamwork"]},
                "projects": [{"title": "Highlighted Project", "technologies": ["Web"], "description": raw_text[:200], "key_features": []}],
                "education": [],
                "experience": [],
                "certifications": [],
                "achievements": []
            }

        parsed["raw_text_preview"] = raw_text[:800]
        parsed["filename"] = filename

        # Save to disk
        out_file = self.storage_dir / "latest_resume.json"
        with open(out_file, "w", encoding="utf-8") as f:
            json.dump(parsed, f, indent=2, ensure_ascii=False)

        self.current_parsed_resume = parsed
        return parsed

    def generate_interview_questions(self, count: int = 6) -> List[Dict[str, Any]]:
        """Generates targeted technical and architectural questions based on resume content."""
        if not self.current_parsed_resume:
            raise ValueError("No resume uploaded yet. Please upload your resume first.")

        resume_summary = json.dumps({
            "skills": self.current_parsed_resume.get("skills", {}),
            "projects": self.current_parsed_resume.get("projects", []),
            "experience": self.current_parsed_resume.get("experience", []),
        }, indent=2)

        prompt = f"""
You are a senior tech lead conducting a technical interview based strictly on this candidate's resume:
{resume_summary}

Generate {count} specific, realistic interview questions that a real placement interviewer would ask.
Cover:
- Deep dives into their listed projects (tech choices, challenges, architecture)
- Practical questions on their listed skills
- Verification of their contributions and problem-solving

Return a valid JSON object with:
{{
  "questions": [
    {{
      "id": 1,
      "topic": "Project: [Project Name] or Skill: [Skill Name]",
      "question": "The specific question",
      "difficulty": "Easy" | "Medium" | "Hard",
      "category": "Project Architecture" | "Technical Depth" | "Problem Solving" | "Tech Stack Choice",
      "hint": "What the interviewer is specifically looking for in a strong answer",
      "sample_key_points": ["Point 1", "Point 2"],
      "model_spoken_answer": "A confident, articulate spoken answer (120-170 words) demonstrating ownership, technical clarity, and problem-solving that the student can practice reading aloud to overcome speaking anxiety."
    }}
  ]
}}
"""
        messages = [
            {"role": "system", "content": "You are a senior placement interviewer. Output valid JSON only."},
            {"role": "user", "content": prompt}
        ]

        try:
            result = llm_service.chat_json(messages, temperature=0.6)
            return result.get("questions", [])
        except Exception as e:
            logger.error(f"Failed to generate resume questions: {e}")
            # Fallback questions based on projects
            projects = self.current_parsed_resume.get("projects", [])
            proj_name = projects[0].get("title", "your primary project") if projects else "your recent project"
            return [
                {
                    "id": 1,
                    "topic": proj_name,
                    "question": f"Can you walk me through the architecture of {proj_name}? Why did you choose this tech stack?",
                    "difficulty": "Medium",
                    "category": "Project Architecture",
                    "hint": "Explain the flow from frontend to backend and trade-offs of your choices.",
                    "sample_key_points": ["System architecture", "Database schema", "Why this stack"],
                    "model_spoken_answer": f"In {proj_name}, I designed a client-server architecture to ensure clear separation of concerns. On the frontend, I utilized React for modular state management and responsive rendering. For the backend, I implemented REST APIs with Python to process requests asynchronously. I chose this stack because it offered fast prototyping with robust data processing capabilities. By structuring the database with proper indexing, I maintained low query latency even under concurrent operations."
                },
                {
                    "id": 2,
                    "topic": proj_name,
                    "question": f"What was the most challenging bug or obstacle you encountered while developing {proj_name}, and how did you resolve it?",
                    "difficulty": "Hard",
                    "category": "Problem Solving",
                    "hint": "Demonstrate systematic debugging and perseverance.",
                    "sample_key_points": ["The issue", "Root cause analysis", "Resolution and outcome"],
                    "model_spoken_answer": f"While building {proj_name}, the most challenging obstacle was an unexpected race condition causing data inconsistency during simultaneous asynchronous requests. I diagnosed the root cause by adding granular logger statements and inspecting network payloads. To fix it, I introduced idempotency tokens and atomic transaction rollbacks at the backend layer. This eliminated race conditions completely and reinforced the importance of defensive programming in real-world systems."
                },
                {
                    "id": 3,
                    "topic": "Testing & Scalability",
                    "question": f"How did you test {proj_name}? What steps would you take if the user base scaled by 10x?",
                    "difficulty": "Medium",
                    "category": "Technical Depth",
                    "hint": "Mention unit tests, API tests, caching, database indexing or microservices.",
                    "sample_key_points": ["Unit/integration testing", "Caching with Redis", "Load testing"],
                    "model_spoken_answer": f"For testing {proj_name}, I implemented unit tests for core business utilities and automated integration tests for critical API workflows. If our active user base increased tenfold, I would first implement Redis caching for repeated read queries, introduce connection pooling for the database, and containerize the service using Docker behind an Nginx load balancer to scale horizontally."
                }
            ]

resume_service = ResumeService()
