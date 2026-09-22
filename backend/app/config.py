import os
from pathlib import Path
from dotenv import load_dotenv

# Base paths
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
SESSIONS_DIR = DATA_DIR / "sessions"
RESUMES_DIR = DATA_DIR / "resumes"

# Ensure runtime directories exist
SESSIONS_DIR.mkdir(parents=True, exist_ok=True)
RESUMES_DIR.mkdir(parents=True, exist_ok=True)

ENV_PATH = BASE_DIR / ".env"

def get_env_var(key: str, default: str = "") -> str:
    """Dynamically reads the environment variable, reloading .env if needed."""
    load_dotenv(ENV_PATH, override=True)
    return os.getenv(key, default).strip()

def get_groq_api_key() -> str:
    return get_env_var("GROQ_API_KEY", "")

def set_groq_api_key(new_key: str):
    """Sets the active Groq key in environment and persists to .env if writable."""
    clean_key = new_key.strip()
    os.environ["GROQ_API_KEY"] = clean_key
    try:
        if ENV_PATH.exists():
            content = ENV_PATH.read_text(encoding="utf-8")
            if "GROQ_API_KEY=" in content:
                lines = content.splitlines()
                new_lines = []
                for line in lines:
                    if line.strip().startswith("GROQ_API_KEY="):
                        new_lines.append(f"GROQ_API_KEY={clean_key}")
                    else:
                        new_lines.append(line)
                ENV_PATH.write_text("\n".join(new_lines) + "\n", encoding="utf-8")
            else:
                ENV_PATH.write_text(content + f"\nGROQ_API_KEY={clean_key}\n", encoding="utf-8")
        else:
            ENV_PATH.write_text(f"GROQ_API_KEY={clean_key}\n", encoding="utf-8")
    except Exception:
        pass

def get_llm_model() -> str:
    return get_env_var("LLM_MODEL", "openai/gpt-oss-120b")

def get_llm_fallback_model() -> str:
    return get_env_var("LLM_FALLBACK_MODEL", "llama-3.3-70b-versatile")

def get_whisper_model() -> str:
    return get_env_var("WHISPER_MODEL", "whisper-large-v3-turbo")

PORT = int(os.getenv("PORT", "8000"))
HOST = os.getenv("HOST", "127.0.0.1")
