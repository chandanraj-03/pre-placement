import json
import re
import uuid
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List, Optional
import requests
from app.config import DATA_DIR

logger = logging.getLogger(__name__)

NOTES_FILE = DATA_DIR / "notes.json"

DEFAULT_CATEGORIES = [
    "General",
    "DSA & Algorithms",
    "Operating Systems",
    "Database Management (DBMS)",
    "Computer Networks",
    "System Design",
    "Aptitude & Reasoning",
    "HR & Soft Skills",
]

class NoteStore:
    def __init__(self, file_path: Path = NOTES_FILE):
        self.file_path = file_path
        self.file_path.parent.mkdir(parents=True, exist_ok=True)
        if not self.file_path.exists():
            self._seed_initial_notes()

    def _load_data(self) -> List[Dict[str, Any]]:
        if not self.file_path.exists():
            return []
        try:
            with open(self.file_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Error reading notes.json: {e}")
            return []

    def _save_data(self, notes: List[Dict[str, Any]]) -> None:
        try:
            with open(self.file_path, "w", encoding="utf-8") as f:
                json.dump(notes, f, indent=2, ensure_ascii=False)
        except Exception as e:
            logger.error(f"Error saving to notes.json: {e}")
            raise e

    def extract_gdrive_file_id(self, url: str) -> Optional[str]:
        """Extracts Google Drive file ID from various link formats."""
        if not url:
            return None
        clean_url = url.strip()

        # Format 1: /file/d/{id}
        m = re.search(r"/file/d/([a-zA-Z0-9_-]+)", clean_url)
        if m:
            return m.group(1)

        # Format 2: /document/d/{id}, /presentation/d/{id}, /spreadsheets/d/{id}, /d/{id}
        m = re.search(r"/d/([a-zA-Z0-9_-]+)", clean_url)
        if m:
            return m.group(1)

        # Format 3: ?id={id} or &id={id}
        m = re.search(r"[?&]id=([a-zA-Z0-9_-]+)", clean_url)
        if m:
            return m.group(1)

        # Format 4: raw file ID (alphanumeric, 20 to 55 chars)
        if re.match(r"^[a-zA-Z0-9_-]{20,55}$", clean_url):
            return clean_url

        return None

    def fetch_gdrive_title(self, file_id: str) -> Optional[str]:
        """Attempts to fetch file title from Google Drive view page without downloading the file."""
        if not file_id:
            return None
        try:
            view_url = f"https://drive.google.com/file/d/{file_id}/view"
            resp = requests.get(
                view_url,
                timeout=4,
                headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    "Accept-Language": "en-US,en;q=0.9",
                }
            )
            if resp.status_code == 200:
                # Try OpenGraph title meta tag first
                og_match = re.search(r'<meta\s+property=["\']og:title["\']\s+content=["\']([^"\']+)["\']', resp.text, re.IGNORECASE)
                if og_match:
                    title = og_match.group(1).strip()
                    if title and title != "Google Drive":
                        return title

                # Fallback to <title> tag
                title_match = re.search(r'<title>(.*?)</title>', resp.text, re.IGNORECASE)
                if title_match:
                    raw_title = title_match.group(1).strip()
                    clean = re.sub(r"\s*-\s*Google Drive\s*$", "", raw_title, flags=re.IGNORECASE).strip()
                    if clean and clean.lower() not in ["google drive", "meet google drive – one place for all your files", "page not found"]:
                        return clean
        except Exception as e:
            logger.debug(f"Could not auto-fetch title for Google Drive file {file_id}: {e}")
        return None

    def _seed_initial_notes(self):
        """Seeds initial placement notes if notes.json doesn't exist yet."""
        seed_notes = [
            {
                "id": f"note_{datetime.now().strftime('%Y%m%d')}_dsa01",
                "title": "DSA & Algorithms Core Patterns Cheat Sheet",
                "file_name": "DSA_Core_Patterns.pdf",
                "gdrive_url": "https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs/view?usp=sharing",
                "file_id": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs",
                "preview_url": "https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs/preview",
                "view_url": "https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs/view?usp=sharing",
                "download_url": "https://drive.google.com/uc?export=download&id=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs",
                "category": "DSA & Algorithms",
                "description": "Essential two pointers, sliding window, binary search, and dynamic programming patterns for coding rounds.",
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat(),
            },
            {
                "id": f"note_{datetime.now().strftime('%Y%m%d')}_os02",
                "title": "Operating Systems - Placement Revision Notes",
                "file_name": "OS_Quick_Revision.pdf",
                "gdrive_url": "https://drive.google.com/file/d/1-5Wcvy_Vq3pYI2B5bL7n-9f_Zq12mNoP/view?usp=sharing",
                "file_id": "1-5Wcvy_Vq3pYI2B5bL7n-9f_Zq12mNoP",
                "preview_url": "https://drive.google.com/file/d/1-5Wcvy_Vq3pYI2B5bL7n-9f_Zq12mNoP/preview",
                "view_url": "https://drive.google.com/file/d/1-5Wcvy_Vq3pYI2B5bL7n-9f_Zq12mNoP/view?usp=sharing",
                "download_url": "https://drive.google.com/uc?export=download&id=1-5Wcvy_Vq3pYI2B5bL7n-9f_Zq12mNoP",
                "category": "Operating Systems",
                "description": "Virtual memory, CPU scheduling algorithms, semaphores vs mutex, deadlocks, and IPC.",
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat(),
            },
            {
                "id": f"note_{datetime.now().strftime('%Y%m%d')}_dbms03",
                "title": "DBMS & SQL Interview Master Notes",
                "file_name": "DBMS_SQL_Interview_Notes.pdf",
                "gdrive_url": "https://drive.google.com/file/d/1A2b3C4d5E6f7G8h9I0jK1l2M3n4O5p6Q/view?usp=sharing",
                "file_id": "1A2b3C4d5E6f7G8h9I0jK1l2M3n4O5p6Q",
                "preview_url": "https://drive.google.com/file/d/1A2b3C4d5E6f7G8h9I0jK1l2M3n4O5p6Q/preview",
                "view_url": "https://drive.google.com/file/d/1A2b3C4d5E6f7G8h9I0jK1l2M3n4O5p6Q/view?usp=sharing",
                "download_url": "https://drive.google.com/uc?export=download&id=1A2b3C4d5E6f7G8h9I0jK1l2M3n4O5p6Q",
                "category": "Database Management (DBMS)",
                "description": "ACID properties, indexing strategies (B-Trees), normalization (1NF-BCNF), and SQL query optimization.",
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat(),
            }
        ]
        self._save_data(seed_notes)

    def list_notes(
        self,
        category: Optional[str] = None,
        search: Optional[str] = None,
        sort_by: str = "newest"
    ) -> List[Dict[str, Any]]:
        notes = self._load_data()

        # Filter by category
        if category and category.lower() != "all":
            notes = [n for n in notes if n.get("category", "").lower() == category.lower()]

        # Filter by search term
        if search and search.strip():
            query = search.strip().lower()
            notes = [
                n for n in notes
                if query in n.get("title", "").lower()
                or query in n.get("file_name", "").lower()
                or query in n.get("category", "").lower()
                or query in n.get("description", "").lower()
            ]

        # Sorting
        if sort_by == "newest":
            notes.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        elif sort_by == "oldest":
            notes.sort(key=lambda x: x.get("created_at", ""))
        elif sort_by == "name_asc":
            notes.sort(key=lambda x: x.get("title", "").lower())
        elif sort_by == "name_desc":
            notes.sort(key=lambda x: x.get("title", "").lower(), reverse=True)
        elif sort_by == "category":
            notes.sort(key=lambda x: (x.get("category", "").lower(), x.get("title", "").lower()))

        return notes

    def get_note(self, note_id: str) -> Optional[Dict[str, Any]]:
        notes = self._load_data()
        for n in notes:
            if n.get("id") == note_id:
                return n
        return None

    def add_note(
        self,
        gdrive_url: str,
        title: Optional[str] = None,
        file_name: Optional[str] = None,
        category: str = "General",
        description: str = "",
    ) -> Dict[str, Any]:
        file_id = self.extract_gdrive_file_id(gdrive_url)
        if not file_id:
            raise ValueError("Invalid Google Drive URL. Please paste a valid Google Drive file share link.")

        # If title or file_name not provided, attempt to auto-fetch from Google Drive
        auto_title = self.fetch_gdrive_title(file_id) if not title else None

        final_title = title.strip() if title and title.strip() else (auto_title or f"Notes - {file_id[:8]}.pdf")
        
        # Determine clean file_name
        if file_name and file_name.strip():
            clean_file_name = file_name.strip()
        elif auto_title and auto_title.lower().endswith(".pdf"):
            clean_file_name = auto_title
        else:
            base = re.sub(r'[^a-zA-Z0-9_\-\s]', '', final_title).strip().replace(" ", "_")
            clean_file_name = f"{base}.pdf" if not base.lower().endswith(".pdf") else base

        note_id = f"note_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:6]}"
        now = datetime.now().isoformat()

        new_note = {
            "id": note_id,
            "title": final_title,
            "file_name": clean_file_name,
            "gdrive_url": gdrive_url.strip(),
            "file_id": file_id,
            "preview_url": f"https://drive.google.com/file/d/{file_id}/preview",
            "view_url": f"https://drive.google.com/file/d/{file_id}/view?usp=sharing",
            "download_url": f"https://drive.google.com/uc?export=download&id={file_id}",
            "category": category.strip() or "General",
            "description": description.strip(),
            "created_at": now,
            "updated_at": now,
        }

        notes = self._load_data()
        notes.insert(0, new_note)
        self._save_data(notes)
        return new_note

    def update_note(
        self,
        note_id: str,
        title: Optional[str] = None,
        file_name: Optional[str] = None,
        category: Optional[str] = None,
        description: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        notes = self._load_data()
        for n in notes:
            if n.get("id") == note_id:
                if title is not None:
                    n["title"] = title.strip()
                if file_name is not None:
                    clean = file_name.strip()
                    n["file_name"] = clean if clean.lower().endswith(".pdf") else f"{clean}.pdf"
                if category is not None:
                    n["category"] = category.strip() or "General"
                if description is not None:
                    n["description"] = description.strip()
                n["updated_at"] = datetime.now().isoformat()
                self._save_data(notes)
                return n
        return None

    def delete_note(self, note_id: str) -> bool:
        notes = self._load_data()
        initial_len = len(notes)
        notes = [n for n in notes if n.get("id") != note_id]
        if len(notes) < initial_len:
            self._save_data(notes)
            return True
        return False

    def get_categories(self) -> List[Dict[str, Any]]:
        notes = self._load_data()
        cat_counts: Dict[str, int] = {}
        for c in DEFAULT_CATEGORIES:
            cat_counts[c] = 0

        for n in notes:
            cat = n.get("category", "General")
            cat_counts[cat] = cat_counts.get(cat, 0) + 1

        result = [{"name": "All", "count": len(notes)}]
        for cat, count in cat_counts.items():
            result.append({"name": cat, "count": count})

        return result


note_store = NoteStore()
