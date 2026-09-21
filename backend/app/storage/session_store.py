import json
import uuid
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List, Optional
from app.config import SESSIONS_DIR

class SessionStore:
    def __init__(self, storage_dir: Path = SESSIONS_DIR):
        self.storage_dir = storage_dir
        self.storage_dir.mkdir(parents=True, exist_ok=True)

    def save_session(self, session_data: Dict[str, Any]) -> Dict[str, Any]:
        session_id = session_data.get("id") or f"sess_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:6]}"
        session_data["id"] = session_id
        if "timestamp" not in session_data:
            session_data["timestamp"] = datetime.now().isoformat()

        file_path = self.storage_dir / f"{session_id}.json"
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(session_data, f, indent=2, ensure_ascii=False)

        return session_data

    def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        file_path = self.storage_dir / f"{session_id}.json"
        if not file_path.exists():
            return None
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)

    def list_sessions(self, limit: int = 50, mode: Optional[str] = None) -> List[Dict[str, Any]]:
        sessions = []
        for file_path in self.storage_dir.glob("*.json"):
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if mode and data.get("mode") != mode:
                        continue
                    # Compact representation for listings
                    sessions.append({
                        "id": data.get("id"),
                        "timestamp": data.get("timestamp"),
                        "mode": data.get("mode"),
                        "title": data.get("title", "Practice Session"),
                        "overall_score": data.get("scores", {}).get("overall", 0),
                        "scores": data.get("scores", {}),
                        "duration_seconds": data.get("duration_seconds", 0),
                        "filler_count": data.get("filler_words", {}).get("total_count", 0),
                    })
            except Exception:
                continue

        # Sort newest first
        sessions.sort(key=lambda s: s.get("timestamp", ""), reverse=True)
        return sessions[:limit]

    def delete_session(self, session_id: str) -> bool:
        file_path = self.storage_dir / f"{session_id}.json"
        if file_path.exists():
            file_path.unlink()
            return True
        return False

    def clear_all_sessions(self) -> int:
        """Deletes all session JSON files from disk."""
        count = 0
        for file_path in self.storage_dir.glob("*.json"):
            try:
                file_path.unlink()
                count += 1
            except Exception:
                pass
        return count

    def get_progress_analytics(self) -> Dict[str, Any]:
        all_sessions = []
        for file_path in self.storage_dir.glob("*.json"):
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    all_sessions.append(json.load(f))
            except Exception:
                continue

        if not all_sessions:
            return {
                "total_sessions": 0,
                "overall_average": 0,
                "score_trends": [],
                "common_weaknesses": [],
                "top_filler_words": {},
                "mode_counts": {"gd": 0, "hr": 0, "resume": 0},
                "improvement_delta": 0,
            }

        all_sessions.sort(key=lambda s: s.get("timestamp", ""))

        mode_counts = {"gd": 0, "hr": 0, "resume": 0}
        score_trends = []
        filler_totals: Dict[str, int] = {}
        weakness_counts: Dict[str, int] = {}

        total_scores = []
        for s in all_sessions:
            m = s.get("mode", "general")
            mode_counts[m] = mode_counts.get(m, 0) + 1

            scores = s.get("scores", {})
            overall = scores.get("overall", 0)
            total_scores.append(overall)

            score_trends.append({
                "id": s.get("id"),
                "timestamp": s.get("timestamp"),
                "mode": m,
                "overall": overall,
                "fluency": scores.get("fluency", 0),
                "grammar": scores.get("grammar", 0),
                "vocabulary": scores.get("vocabulary", 0),
                "relevance": scores.get("relevance", 0),
                "structure": scores.get("structure", 0),
            })

            # Tally fillers
            breakdown = s.get("filler_words", {}).get("breakdown", {})
            for word, count in breakdown.items():
                filler_totals[word.lower()] = filler_totals.get(word.lower(), 0) + count

            # Tally weaknesses
            weaknesses = s.get("feedback", {}).get("weaknesses", [])
            for w in weaknesses:
                weakness_counts[w] = weakness_counts.get(w, 0) + 1

        # Calculate improvement delta (last 3 vs first 3)
        if len(total_scores) >= 2:
            first_half = total_scores[:min(3, len(total_scores))]
            recent_half = total_scores[-min(3, len(total_scores)):]
            delta = round((sum(recent_half) / len(recent_half)) - (sum(first_half) / len(first_half)), 1)
        else:
            delta = 0

        # Sort top fillers
        top_fillers = sorted(filler_totals.items(), key=lambda x: x[1], reverse=True)[:6]
        # Sort top recurring weaknesses
        top_weaknesses = sorted(weakness_counts.items(), key=lambda x: x[1], reverse=True)[:5]

        return {
            "total_sessions": len(all_sessions),
            "overall_average": round(sum(total_scores) / len(total_scores), 1),
            "score_trends": score_trends,
            "top_filler_words": dict(top_fillers),
            "common_weaknesses": [{"weakness": w, "count": c} for w, c in top_weaknesses],
            "mode_counts": mode_counts,
            "improvement_delta": delta,
        }

session_store = SessionStore()
