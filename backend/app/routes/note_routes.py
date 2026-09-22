import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from app.storage.note_store import note_store

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/notes", tags=["Notes & Google Drive Study Material"])

class ParseLinkPayload(BaseModel):
    gdrive_url: str = Field(..., description="Google Drive share link or file URL")

class AddNotePayload(BaseModel):
    gdrive_url: str = Field(..., description="Google Drive share link")
    title: Optional[str] = Field(None, description="Note title or display name")
    file_name: Optional[str] = Field(None, description="PDF file name")
    category: Optional[str] = Field("General", description="Folder/category name")
    description: Optional[str] = Field("", description="Optional notes or summary description")

class UpdateNotePayload(BaseModel):
    title: Optional[str] = None
    file_name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None

@router.get("")
async def get_notes(
    category: Optional[str] = Query(None, description="Filter by category"),
    search: Optional[str] = Query(None, description="Search term across title/content/name"),
    sort_by: str = Query("newest", description="Sort option: newest, oldest, name_asc, name_desc, category"),
):
    """Returns list of saved notes stored persistently in notes.json."""
    notes = note_store.list_notes(category=category, search=search, sort_by=sort_by)
    return {"success": True, "count": len(notes), "notes": notes}

@router.get("/categories")
async def get_categories():
    """Returns list of categories with item counts."""
    categories = note_store.get_categories()
    return {"success": True, "categories": categories}

@router.post("/parse-link")
async def parse_gdrive_link(payload: ParseLinkPayload):
    """Extracts Google Drive file ID, preview URL, and auto-detects title without saving."""
    file_id = note_store.extract_gdrive_file_id(payload.gdrive_url)
    if not file_id:
        raise HTTPException(
            status_code=400,
            detail="Could not detect a valid Google Drive file ID. Please ensure the link is a valid Google Drive share link."
        )

    title = note_store.fetch_gdrive_title(file_id)
    return {
        "success": True,
        "file_id": file_id,
        "preview_url": f"https://drive.google.com/file/d/{file_id}/preview",
        "view_url": f"https://drive.google.com/file/d/{file_id}/view?usp=sharing",
        "download_url": f"https://drive.google.com/uc?export=download&id={file_id}",
        "suggested_title": title or "",
        "suggested_file_name": f"{title}.pdf" if title and not title.lower().endswith(".pdf") else (title or f"Notes_{file_id[:8]}.pdf"),
    }

@router.post("")
async def create_note(payload: AddNotePayload):
    """Saves a new note to persistent JSON storage."""
    try:
        new_note = note_store.add_note(
            gdrive_url=payload.gdrive_url,
            title=payload.title,
            file_name=payload.file_name,
            category=payload.category or "General",
            description=payload.description or "",
        )
        return {
            "success": True,
            "message": "Note saved successfully!",
            "note": new_note,
        }
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Failed to save note: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to save note: {str(e)}")

@router.get("/{note_id}")
async def get_single_note(note_id: str):
    """Fetches details for a specific note."""
    note = note_store.get_note(note_id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return {"success": True, "note": note}

@router.put("/{note_id}")
async def update_note(note_id: str, payload: UpdateNotePayload):
    """Updates note details (title, file name, category, description)."""
    updated = note_store.update_note(
        note_id=note_id,
        title=payload.title,
        file_name=payload.file_name,
        category=payload.category,
        description=payload.description,
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Note not found")
    return {"success": True, "message": "Note updated successfully", "note": updated}

DELETE_PASSWORD = "chandan@123"

@router.delete("/{note_id}")
async def delete_note(
    note_id: str,
    password: Optional[str] = Query(None, description="Password to prevent accidental deletion"),
):
    """Manually deletes a note. Requires default password 'chandan@123'."""
    if password != DELETE_PASSWORD:
        raise HTTPException(
            status_code=403,
            detail="Incorrect deletion password. Please enter 'chandan@123' to confirm deletion."
        )

    deleted = note_store.delete_note(note_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Note not found or already deleted")
    return {"success": True, "message": "Note deleted successfully"}
