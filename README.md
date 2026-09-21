# PrepAI — Personal AI Pre-Placement Preparation Assistant

A personal AI-powered preparation coach designed to help students master **Group Discussions (GD)**, **HR Interviews**, and **Resume-Based Technical Interviews** before placement season.

---

## Features

1. **Group Discussion (GD) Practice**
   - Generates trending and placement-relevant GD topics across Tech, Business, and Social sectors.
   - Provides comprehensive preparation notes: Arguments FOR & AGAINST, power vocabulary with definitions, and high-impact opening and conclusion hooks.
   - Dual STT voice recording: Groq Whisper API (primary) with Web Speech API live preview and automatic fallback.
   - Instant AI evaluation: Fluency, Grammar, Vocabulary, Relevance, and Structure scores (0-100), filler word detection, speaking pace (WPM), and model answer sample.

2. **HR Interview Simulator**
   - Realistic behavioral, situational, and culture-fit questions.
   - Explains interviewer intent and provides targeted **STAR (Situation, Task, Action, Result)** guidelines.
   - Automatically assesses whether the candidate followed the STAR framework.

3. **Resume-Based Technical Interview**
   - Drag-and-drop PDF resume uploader.
   - Extracts projects, technical skills, and internships using `pdfplumber` and LLM structuring.
   - Generates custom technical deep-dive questions based strictly on the candidate's actual projects and tech choices.

4. **Personal Performance Analytics & History**
   - JSON-file-based persistent storage on the backend (no heavy database required).
   - Direct comparison between early sessions and latest sessions.
   - Common recurring weaknesses tracker.
   - Top repeated filler words aggregator.

---

## Tech Stack

- **Frontend**: Plain React 19 + Vite 8, Lucide Icons, Canvas Confetti, and Vanilla CSS glassmorphic dark-mode design system.
- **Backend**: Python 3.11 + FastAPI + Uvicorn + Pydantic.
- **AI Models**: Groq LPU API:
  - LLM: `openai/gpt-oss-120b` (with automatic fallback to `llama-3.3-70b-versatile`).
  - STT: `whisper-large-v3-turbo` + Browser Web Speech API fallback.
- **PDF Extraction**: `pdfplumber`.

---

## Quick Start Guide

### 1. Backend Setup
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate      # Windows
pip install -r requirements.txt
```

Verify your API key in `backend/.env`:
```env
GROQ_API_KEY=your_groq_api_key_here
LLM_MODEL=openai/gpt-oss-120b
LLM_FALLBACK_MODEL=llama-3.3-70b-versatile
```

Run the backend server:
```bash
.\venv\Scripts\python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Open [http://127.0.0.1:5173](http://127.0.0.1:5173) in your browser.
