import React, { useState, useEffect, useMemo } from "react";
import {
  BookOpen,
  Plus,
  Search,
  Folder,
  FileText,
  ExternalLink,
  Download,
  Trash2,
  Edit3,
  Maximize2,
  Minimize2,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowUpDown,
  X,
  Eye,
  EyeOff,
  FileCheck,
  RefreshCw,
  Copy,
  Check,
  List,
  Lock,
  ShieldAlert,
} from "lucide-react";
import { api } from "../api/client";

const DEFAULT_CATEGORIES = [
  "All",
  "DSA & Algorithms",
  "Operating Systems",
  "Database Management (DBMS)",
  "Computer Networks",
  "System Design",
  "Aptitude & Reasoning",
  "HR & Soft Skills",
  "General",
];

const REQUIRED_DELETE_PASSWORD = "chandan@123";

export default function Notes() {
  const [notes, setNotes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Mobile view toggle ("list" | "preview")
  const [mobileView, setMobileView] = useState("list");

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showFullscreenModal, setShowFullscreenModal] = useState(false);
  const [activeNoteForAction, setActiveNoteForAction] = useState(null);

  // Add Note Form state
  const [addForm, setAddForm] = useState({
    gdrive_url: "",
    title: "",
    file_name: "",
    category: "DSA & Algorithms",
    custom_category: "",
    description: "",
  });
  const [isParsingLink, setIsParsingLink] = useState(false);
  const [parseStatus, setParseStatus] = useState({ success: null, message: "", previewUrl: "" });
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Edit Note Form state
  const [editForm, setEditForm] = useState({
    title: "",
    file_name: "",
    category: "General",
    custom_category: "",
    description: "",
  });
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete Note Password Confirmation state
  const [deletePassword, setDeletePassword] = useState("");
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Copied link toast state
  const [copiedNoteId, setCopiedNoteId] = useState(null);

  // Fetch all notes
  const fetchNotes = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const res = await api.getNotes(selectedCategory, searchQuery, sortBy);
      if (res && res.notes) {
        setNotes(res.notes);
        // Automatically select the first note if none is selected
        if (!selectedNoteId && res.notes.length > 0) {
          setSelectedNoteId(res.notes[0].id);
        } else if (selectedNoteId && !res.notes.some((n) => n.id === selectedNoteId)) {
          setSelectedNoteId(res.notes[0]?.id || null);
        }
      }
    } catch (err) {
      console.error("Error fetching notes:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const res = await api.getNoteCategories();
      if (res && res.categories) {
        setCategories(res.categories);
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  useEffect(() => {
    fetchNotes(true);
    fetchCategories();
  }, [selectedCategory, sortBy]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchNotes(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const activeNote = useMemo(() => {
    return notes.find((n) => n.id === selectedNoteId) || notes[0] || null;
  }, [notes, selectedNoteId]);

  // Handle Google Drive Link auto-parsing
  const handleLinkInputBlur = async (url) => {
    const clean = (url || addForm.gdrive_url).trim();
    if (!clean) return;

    setIsParsingLink(true);
    setParseStatus({ success: null, message: "Analyzing Google Drive link...", previewUrl: "" });
    setFormError("");

    try {
      const res = await api.parseGDriveLink(clean);
      if (res && res.success) {
        setParseStatus({
          success: true,
          message: "Valid Google Drive PDF link detected!",
          previewUrl: res.preview_url,
        });

        // Auto-fill title and file name if user hasn't typed their own
        setAddForm((prev) => ({
          ...prev,
          title: prev.title || res.suggested_title || `Placement Notes (${res.file_id.slice(0, 6)})`,
          file_name: prev.file_name || res.suggested_file_name || "Study_Notes.pdf",
        }));
      }
    } catch (err) {
      setParseStatus({
        success: false,
        message: err.message || "Could not parse Google Drive link. Please check the URL.",
        previewUrl: "",
      });
    } finally {
      setIsParsingLink(false);
    }
  };

  // Handle Adding Note
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!addForm.gdrive_url.trim()) {
      setFormError("Please paste a Google Drive file link.");
      return;
    }

    setIsSaving(true);
    setFormError("");

    try {
      const finalCategory =
        addForm.category === "Custom"
          ? addForm.custom_category.trim() || "General"
          : addForm.category;

      const res = await api.addNote({
        gdriveUrl: addForm.gdrive_url.trim(),
        title: addForm.title.trim(),
        fileName: addForm.file_name.trim(),
        category: finalCategory,
        description: addForm.description.trim(),
      });

      if (res && res.success) {
        setShowAddModal(false);
        setAddForm({
          gdrive_url: "",
          title: "",
          file_name: "",
          category: "DSA & Algorithms",
          custom_category: "",
          description: "",
        });
        setParseStatus({ success: null, message: "", previewUrl: "" });
        await fetchNotes(false);
        await fetchCategories();
        if (res.note?.id) {
          setSelectedNoteId(res.note.id);
          setMobileView("preview");
        }
      }
    } catch (err) {
      setFormError(err.message || "Failed to save note. Please check the link and try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (note) => {
    setActiveNoteForAction(note);
    const isStandard = DEFAULT_CATEGORIES.includes(note.category);
    setEditForm({
      title: note.title,
      file_name: note.file_name,
      category: isStandard ? note.category : "Custom",
      custom_category: isStandard ? "" : note.category,
      description: note.description || "",
    });
    setShowEditModal(true);
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!activeNoteForAction) return;

    setIsUpdating(true);
    try {
      const finalCategory =
        editForm.category === "Custom"
          ? editForm.custom_category.trim() || "General"
          : editForm.category;

      const res = await api.updateNote(activeNoteForAction.id, {
        title: editForm.title.trim(),
        fileName: editForm.file_name.trim(),
        category: finalCategory,
        description: editForm.description.trim(),
      });

      if (res && res.success) {
        setShowEditModal(false);
        await fetchNotes(false);
        await fetchCategories();
      }
    } catch (err) {
      alert(`Update failed: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  // Open Delete Confirmation Modal (resets password & errors)
  const openDeleteModal = (note) => {
    setActiveNoteForAction(note);
    setDeletePassword("");
    setDeleteError("");
    setShowDeletePassword(false);
    setShowDeleteModal(true);
  };

  // Handle Delete with Required Password
  const handleDeleteConfirm = async (e) => {
    if (e) e.preventDefault();
    if (!activeNoteForAction) return;

    if (!deletePassword) {
      setDeleteError("Please enter the deletion password to proceed.");
      return;
    }

    if (deletePassword !== REQUIRED_DELETE_PASSWORD) {
      setDeleteError("Incorrect security password. Please enter the correct password.");
      return;
    }

    setIsDeleting(true);
    setDeleteError("");

    try {
      await api.deleteNote(activeNoteForAction.id, deletePassword);
      setShowDeleteModal(false);
      setActiveNoteForAction(null);
      setDeletePassword("");
      await fetchNotes(false);
      await fetchCategories();
    } catch (err) {
      setDeleteError(err.message || "Deletion failed. Please verify password and try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Copy shareable Drive Link
  const handleCopyLink = (note) => {
    if (!note?.gdrive_url) return;
    navigator.clipboard.writeText(note.gdrive_url);
    setCopiedNoteId(note.id);
    setTimeout(() => setCopiedNoteId(null), 2000);
  };

  // Format date helper
  const formatDate = (isoString) => {
    if (!isoString) return "";
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch {
      return isoString;
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* 1. Header Banner */}
      <div
        className="glass-panel"
        style={{
          padding: "clamp(18px, 4vw, 26px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
          background: "linear-gradient(135deg, rgba(20, 26, 46, 0.85) 0%, rgba(30, 41, 69, 0.7) 100%)",
        }}
      >
        <div style={{ maxWidth: "620px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px", flexWrap: "wrap" }}>
            <span className="badge badge-indigo">
              <BookOpen size={14} /> Placement Study Notes
            </span>
            <span className="badge badge-cyan">
              <FileCheck size={14} /> Google Drive PDF Viewer
            </span>
            <span className="badge badge-emerald" title="Stored safely in notes.json">
              Permanent Storage
            </span>
          </div>
          <h1 style={{ fontSize: "clamp(1.4rem, 4vw, 2rem)", fontWeight: "800", marginBottom: "6px" }}>
            Placement Notes & Cheat Sheets
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.92rem", lineHeight: "1.5" }}>
            Save and organize your study notes using Google Drive links. View PDFs directly within the app,
            organize by folders, search concepts, and never lose your revision materials.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <button
            onClick={() => {
              setIsRefreshing(true);
              fetchNotes(false);
              fetchCategories();
            }}
            className="btn btn-secondary"
            title="Refresh Notes list"
            style={{ padding: "10px 14px" }}
          >
            <RefreshCw size={16} className={isRefreshing ? "spin" : ""} />
            <span className="desktop-only">Refresh</span>
          </button>

          <button
            onClick={() => {
              setAddForm({
                gdrive_url: "",
                title: "",
                file_name: "",
                category: selectedCategory !== "All" ? selectedCategory : "DSA & Algorithms",
                custom_category: "",
                description: "",
              });
              setParseStatus({ success: null, message: "", previewUrl: "" });
              setFormError("");
              setShowAddModal(true);
            }}
            className="btn btn-primary"
            style={{
              padding: "10px 20px",
              gap: "8px",
              fontWeight: "600",
              boxShadow: "0 4px 16px rgba(99, 102, 241, 0.35)",
            }}
          >
            <Plus size={18} />
            <span>Add Google Drive Note</span>
          </button>
        </div>
      </div>

      {/* 2. Search, Sort & Category Filter Bar */}
      <div
        className="glass-panel"
        style={{
          padding: "clamp(12px, 3vw, 18px)",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          {/* Search bar */}
          <div
            style={{
              position: "relative",
              flex: "1 1 280px",
              maxWidth: "520px",
            }}
          >
            <Search
              size={16}
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-muted)",
              }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by note title, PDF file name, or topic..."
              className="input-field"
              style={{
                width: "100%",
                paddingLeft: "36px",
                paddingRight: "12px",
                height: "40px",
                fontSize: "0.9rem",
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
              <ArrowUpDown size={14} /> Sort:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input-field"
              style={{
                height: "40px",
                padding: "0 12px",
                fontSize: "0.85rem",
                width: "auto",
                minWidth: "140px",
              }}
            >
              <option value="newest">Recently Added</option>
              <option value="oldest">Oldest First</option>
              <option value="name_asc">Name (A to Z)</option>
              <option value="name_desc">Name (Z to A)</option>
              <option value="category">By Category</option>
            </select>
          </div>
        </div>

        {/* Categories Pills */}
        <div
          className="tab-scroll-container"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            overflowX: "auto",
            paddingBottom: "4px",
          }}
        >
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginRight: "4px", whiteSpace: "nowrap" }}>
            Folders:
          </span>

          {(() => {
            const catMap = new Map();
            categories.forEach((c) => catMap.set(c.name, c.count));

            const list = ["All", ...DEFAULT_CATEGORIES.filter((c) => c !== "All")];
            categories.forEach((c) => {
              if (!list.includes(c.name)) list.push(c.name);
            });

            return list.map((catName) => {
              const isSelected = selectedCategory.toLowerCase() === catName.toLowerCase();
              const count = catMap.get(catName) ?? (catName === "All" ? notes.length : 0);

              return (
                <button
                  key={catName}
                  onClick={() => setSelectedCategory(catName)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "6px 14px",
                    borderRadius: "var(--radius-full)",
                    fontSize: "0.82rem",
                    fontWeight: isSelected ? "700" : "500",
                    border: isSelected ? "1px solid var(--accent-primary)" : "1px solid var(--border-subtle)",
                    background: isSelected ? "rgba(99, 102, 241, 0.2)" : "rgba(255, 255, 255, 0.03)",
                    color: isSelected ? "#c7d2fe" : "var(--text-secondary)",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    transition: "all 0.2s ease",
                  }}
                >
                  <Folder size={13} style={{ opacity: isSelected ? 1 : 0.6 }} />
                  <span>{catName}</span>
                  {count > 0 && (
                    <span
                      style={{
                        padding: "1px 6px",
                        fontSize: "0.72rem",
                        borderRadius: "10px",
                        background: isSelected ? "var(--accent-primary)" : "rgba(255, 255, 255, 0.1)",
                        color: isSelected ? "#fff" : "var(--text-muted)",
                      }}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            });
          })()}
        </div>
      </div>

      {/* 3. Mobile View Switcher */}
      <div
        className="mobile-only"
        style={{
          display: "flex",
          borderRadius: "var(--radius-md)",
          background: "rgba(0, 0, 0, 0.3)",
          padding: "4px",
          border: "1px solid var(--border-subtle)",
        }}
      >
        <button
          onClick={() => setMobileView("list")}
          style={{
            flex: 1,
            padding: "8px 12px",
            borderRadius: "var(--radius-sm)",
            border: "none",
            background: mobileView === "list" ? "var(--accent-primary)" : "transparent",
            color: mobileView === "list" ? "#fff" : "var(--text-secondary)",
            fontWeight: mobileView === "list" ? "700" : "500",
            fontSize: "0.88rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            cursor: "pointer",
          }}
        >
          <List size={16} />
          <span>Notes List ({notes.length})</span>
        </button>

        <button
          onClick={() => setMobileView("preview")}
          style={{
            flex: 1,
            padding: "8px 12px",
            borderRadius: "var(--radius-sm)",
            border: "none",
            background: mobileView === "preview" ? "var(--accent-primary)" : "transparent",
            color: mobileView === "preview" ? "#fff" : "var(--text-secondary)",
            fontWeight: mobileView === "preview" ? "700" : "500",
            fontSize: "0.88rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            cursor: "pointer",
          }}
        >
          <Eye size={16} />
          <span>PDF Preview {activeNote ? `(${activeNote.file_name.slice(0, 12)}...)` : ""}</span>
        </button>
      </div>

      {/* 4. Dual Panel Main Workspace */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "20px",
          alignItems: "start",
        }}
      >
        {/* LEFT PANEL: Saved Notes File Manager List */}
        <div
          className={`notes-list-panel ${mobileView === "preview" ? "mobile-hidden" : ""}`}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            maxHeight: "850px",
            overflowY: "auto",
            paddingRight: "4px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 4px" }}>
            <span style={{ fontSize: "0.88rem", fontWeight: "700", color: "var(--text-secondary)" }}>
              Saved PDF Notes ({notes.length})
            </span>
            <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
              Click a file to view PDF preview
            </span>
          </div>

          {isLoading ? (
            <div className="glass-panel" style={{ padding: "40px 20px", textAlign: "center" }}>
              <span className="spinner" style={{ width: "24px", height: "24px", marginBottom: "12px" }} />
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Loading your notes...</p>
            </div>
          ) : notes.length === 0 ? (
            <div
              className="glass-panel"
              style={{
                padding: "40px 24px",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  background: "rgba(99, 102, 241, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--accent-primary)",
                }}
              >
                <BookOpen size={26} />
              </div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: "700" }}>No notes found</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", maxWidth: "340px" }}>
                {searchQuery
                  ? `No notes matching "${searchQuery}". Try a different search term or category.`
                  : "Save your first Google Drive PDF link to preview and manage placement study notes."}
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="btn btn-primary"
                style={{ marginTop: "6px", gap: "8px" }}
              >
                <Plus size={16} />
                <span>Add Note Now</span>
              </button>
            </div>
          ) : (
            notes.map((note) => {
              const isSelected = activeNote?.id === note.id;

              return (
                <div
                  key={note.id}
                  onClick={() => {
                    setSelectedNoteId(note.id);
                    setMobileView("preview");
                  }}
                  className={`glass-panel ${isSelected ? "glass-panel-glow" : ""}`}
                  style={{
                    padding: "14px 16px",
                    cursor: "pointer",
                    border: isSelected
                      ? "1px solid var(--accent-primary)"
                      : "1px solid var(--border-subtle)",
                    background: isSelected
                      ? "linear-gradient(135deg, rgba(99, 102, 241, 0.18) 0%, rgba(30, 41, 69, 0.5) 100%)"
                      : "var(--bg-glass)",
                    transition: "all 0.2s ease",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    position: "relative",
                  }}
                >
                  {/* Card Top Row: File icon, Title & Category */}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                    <div
                      style={{
                        minWidth: "38px",
                        height: "38px",
                        borderRadius: "var(--radius-sm)",
                        background: isSelected ? "rgba(244, 63, 94, 0.25)" : "rgba(244, 63, 94, 0.12)",
                        border: "1px solid rgba(244, 63, 94, 0.3)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fb7185",
                        flexShrink: 0,
                      }}
                    >
                      <FileText size={20} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
                        <span
                          className="badge badge-indigo"
                          style={{ fontSize: "0.72rem", padding: "2px 8px" }}
                        >
                          {note.category}
                        </span>
                        <span
                          style={{
                            fontSize: "0.72rem",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            background: "rgba(244, 63, 94, 0.15)",
                            color: "#fda4af",
                            fontWeight: "700",
                          }}
                        >
                          PDF
                        </span>
                      </div>

                      <h4
                        style={{
                          fontSize: "0.96rem",
                          fontWeight: "700",
                          color: isSelected ? "#fff" : "var(--text-primary)",
                          lineHeight: "1.35",
                          marginBottom: "4px",
                          wordBreak: "break-word",
                        }}
                      >
                        {note.title}
                      </h4>

                      <div
                        style={{
                          fontSize: "0.8rem",
                          color: "var(--accent-cyan)",
                          fontFamily: "monospace",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        📄 {note.file_name}
                      </div>
                    </div>
                  </div>

                  {/* Optional Description */}
                  {note.description && (
                    <p
                      style={{
                        fontSize: "0.82rem",
                        color: "var(--text-muted)",
                        lineHeight: "1.4",
                        margin: 0,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {note.description}
                    </p>
                  )}

                  {/* Card Bottom Row: Metadata & Quick Actions */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      borderTop: "1px solid rgba(255, 255, 255, 0.06)",
                      paddingTop: "8px",
                      fontSize: "0.76rem",
                      color: "var(--text-muted)",
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <Clock size={12} /> {formatDate(note.created_at)}
                    </span>

                    <div
                      onClick={(e) => e.stopPropagation()}
                      style={{ display: "flex", alignItems: "center", gap: "6px" }}
                    >
                      {/* Copy Drive Link */}
                      <button
                        onClick={() => handleCopyLink(note)}
                        title="Copy Google Drive link"
                        style={{
                          background: "none",
                          border: "none",
                          color: copiedNoteId === note.id ? "var(--accent-emerald)" : "var(--text-muted)",
                          cursor: "pointer",
                          padding: "4px",
                          display: "flex",
                          alignItems: "center",
                          borderRadius: "4px",
                        }}
                      >
                        {copiedNoteId === note.id ? <Check size={14} /> : <Copy size={14} />}
                      </button>

                      {/* Open in Drive */}
                      <a
                        href={note.view_url || note.gdrive_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Open in Google Drive"
                        style={{
                          color: "var(--text-muted)",
                          padding: "4px",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <ExternalLink size={14} />
                      </a>

                      {/* Edit / Rename */}
                      <button
                        onClick={() => openEditModal(note)}
                        title="Rename or change folder"
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--text-muted)",
                          cursor: "pointer",
                          padding: "4px",
                          display: "flex",
                          alignItems: "center",
                          borderRadius: "4px",
                        }}
                      >
                        <Edit3 size={14} />
                      </button>

                      {/* Delete with Password Protection */}
                      <button
                        onClick={() => openDeleteModal(note)}
                        title="Delete note (security password required)"
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--text-muted)",
                          cursor: "pointer",
                          padding: "4px",
                          display: "flex",
                          alignItems: "center",
                          borderRadius: "4px",
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* RIGHT PANEL: In-App Embedded Google Drive PDF Viewer */}
        <div
          className={`notes-preview-panel ${mobileView === "list" ? "mobile-hidden" : ""}`}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            minWidth: 0,
          }}
        >
          {activeNote ? (
            <div
              className="glass-panel"
              style={{
                padding: "clamp(12px, 2.5vw, 18px)",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                border: "1px solid rgba(99, 102, 241, 0.3)",
                background: "rgba(11, 17, 32, 0.88)",
              }}
            >
              {/* Viewer Header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "10px",
                  borderBottom: "1px solid var(--border-subtle)",
                  paddingBottom: "12px",
                }}
              >
                <div style={{ flex: 1, minWidth: "220px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
                    <span className="badge badge-indigo">{activeNote.category}</span>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                      Saved on {formatDate(activeNote.created_at)}
                    </span>
                  </div>
                  <h3
                    style={{
                      fontSize: "clamp(1.05rem, 3vw, 1.3rem)",
                      fontWeight: "700",
                      color: "var(--text-primary)",
                      lineHeight: "1.3",
                    }}
                  >
                    {activeNote.title}
                  </h3>
                  <p style={{ fontSize: "0.8rem", color: "var(--accent-cyan)", margin: "2px 0 0 0" }}>
                    📄 {activeNote.file_name}
                  </p>
                </div>

                {/* Toolbar Buttons */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  {/* Fullscreen Modal Toggle */}
                  <button
                    onClick={() => setShowFullscreenModal(true)}
                    className="btn btn-secondary"
                    style={{ padding: "7px 12px", fontSize: "0.82rem", gap: "6px" }}
                    title="Read in Fullscreen"
                  >
                    <Maximize2 size={15} />
                    <span>Fullscreen</span>
                  </button>

                  {/* Open in Google Drive */}
                  <a
                    href={activeNote.view_url || activeNote.gdrive_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary"
                    style={{ padding: "7px 12px", fontSize: "0.82rem", gap: "6px" }}
                    title="Open original file in Google Drive"
                  >
                    <ExternalLink size={15} />
                    <span className="desktop-only">Open Drive</span>
                  </a>

                  {/* Download PDF */}
                  <a
                    href={activeNote.download_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    className="btn btn-secondary"
                    style={{ padding: "7px 12px", fontSize: "0.82rem", gap: "6px" }}
                    title="Direct PDF download"
                  >
                    <Download size={15} />
                    <span className="desktop-only">Download</span>
                  </a>

                  {/* Edit/Rename */}
                  <button
                    onClick={() => openEditModal(activeNote)}
                    className="btn btn-secondary"
                    style={{ padding: "7px 10px" }}
                    title="Rename"
                  >
                    <Edit3 size={15} />
                  </button>

                  {/* Delete with Password Protection */}
                  <button
                    onClick={() => openDeleteModal(activeNote)}
                    className="btn btn-danger"
                    style={{ padding: "7px 10px" }}
                    title="Delete Note (Password required)"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {/* Note Description if available */}
              {activeNote.description && (
                <div
                  style={{
                    fontSize: "0.85rem",
                    color: "var(--text-secondary)",
                    background: "rgba(255, 255, 255, 0.03)",
                    padding: "8px 12px",
                    borderRadius: "var(--radius-sm)",
                    borderLeft: "3px solid var(--accent-primary)",
                  }}
                >
                  💡 {activeNote.description}
                </div>
              )}

              {/* Embedded Google Drive PDF Viewer (iFrame) */}
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  height: "clamp(480px, 68vh, 760px)",
                  borderRadius: "var(--radius-md)",
                  overflow: "hidden",
                  border: "1px solid var(--border-subtle)",
                  background: "#1e1e24",
                }}
              >
                <iframe
                  title={`Preview of ${activeNote.title}`}
                  src={activeNote.preview_url}
                  width="100%"
                  height="100%"
                  allow="autoplay"
                  style={{
                    border: "none",
                    display: "block",
                    width: "100%",
                    height: "100%",
                  }}
                />
              </div>

              {/* Viewer Footer Tips */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "8px",
                  fontSize: "0.78rem",
                  color: "var(--text-muted)",
                  padding: "4px 2px",
                }}
              >
                <span>
                  💡 <strong>PDF Preview:</strong> Rendered directly inside PrepAI. Make sure your Google Drive link sharing is set to <em>"Anyone with the link can view"</em>.
                </span>
                <button
                  onClick={() => handleCopyLink(activeNote)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--accent-cyan)",
                    cursor: "pointer",
                    textDecoration: "underline",
                    fontSize: "0.78rem",
                    padding: 0,
                  }}
                >
                  {copiedNoteId === activeNote.id ? "✓ Link Copied!" : "Copy Drive Link"}
                </button>
              </div>
            </div>
          ) : (
            <div
              className="glass-panel"
              style={{
                padding: "60px 20px",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <FileText size={40} style={{ color: "var(--text-muted)", opacity: 0.5 }} />
              <h3 style={{ fontSize: "1.1rem", fontWeight: "700" }}>No PDF Note Selected</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", maxWidth: "340px" }}>
                Select any note from the list on the left to preview the PDF directly here.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 5. Add Note Modal */}
      {showAddModal && (
        <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div
            className="modal-content glass-panel"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "560px", width: "95%", padding: "clamp(20px, 4vw, 30px)" }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "var(--radius-sm)",
                    background: "rgba(99, 102, 241, 0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--accent-primary)",
                  }}
                >
                  <Plus size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: "1.2rem", fontWeight: "700" }}>Add Google Drive Note</h3>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    Paste a link to view and save PDF study materials
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Google Drive URL */}
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", marginBottom: "6px" }}>
                  Google Drive Link <span style={{ color: "#f43f5e" }}>*</span>
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type="url"
                    required
                    value={addForm.gdrive_url}
                    onChange={(e) => {
                      setAddForm({ ...addForm, gdrive_url: e.target.value });
                      setParseStatus({ success: null, message: "", previewUrl: "" });
                    }}
                    onBlur={(e) => handleLinkInputBlur(e.target.value)}
                    placeholder="https://drive.google.com/file/d/1BxiMVs.../view?usp=sharing"
                    className="input-field"
                    style={{ width: "100%", paddingRight: "40px", fontSize: "0.9rem" }}
                  />
                  {isParsingLink && (
                    <span
                      className="spinner"
                      style={{
                        position: "absolute",
                        right: "12px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        width: "16px",
                        height: "16px",
                      }}
                    />
                  )}
                </div>

                {/* Parse status feedback */}
                {parseStatus.message && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      marginTop: "6px",
                      fontSize: "0.8rem",
                      color: parseStatus.success ? "var(--accent-emerald)" : "#fda4af",
                    }}
                  >
                    {parseStatus.success ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                    <span>{parseStatus.message}</span>
                  </div>
                )}
              </div>

              {/* Title */}
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", marginBottom: "6px" }}>
                  Note Title / Topic Name
                </label>
                <input
                  type="text"
                  value={addForm.title}
                  onChange={(e) => setAddForm({ ...addForm, title: e.target.value })}
                  placeholder="e.g. Dynamic Programming Cheat Sheet"
                  className="input-field"
                  style={{ width: "100%", fontSize: "0.9rem" }}
                />
              </div>

              {/* File Name & Category Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", marginBottom: "6px" }}>
                    PDF File Name
                  </label>
                  <input
                    type="text"
                    value={addForm.file_name}
                    onChange={(e) => setAddForm({ ...addForm, file_name: e.target.value })}
                    placeholder="DP_Notes.pdf"
                    className="input-field"
                    style={{ width: "100%", fontSize: "0.88rem" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", marginBottom: "6px" }}>
                    Folder / Category
                  </label>
                  <select
                    value={addForm.category}
                    onChange={(e) => setAddForm({ ...addForm, category: e.target.value })}
                    className="input-field"
                    style={{ width: "100%", fontSize: "0.88rem" }}
                  >
                    {DEFAULT_CATEGORIES.filter((c) => c !== "All").map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                    <option value="Custom">+ Custom Folder...</option>
                  </select>
                </div>
              </div>

              {addForm.category === "Custom" && (
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", marginBottom: "6px" }}>
                    Custom Folder Name
                  </label>
                  <input
                    type="text"
                    value={addForm.custom_category}
                    onChange={(e) => setAddForm({ ...addForm, custom_category: e.target.value })}
                    placeholder="e.g. AWS & Cloud Computing"
                    className="input-field"
                    style={{ width: "100%", fontSize: "0.88rem" }}
                    autoFocus
                  />
                </div>
              )}

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", marginBottom: "6px" }}>
                  Notes / Summary (Optional)
                </label>
                <textarea
                  rows={2}
                  value={addForm.description}
                  onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
                  placeholder="Key concepts covered, important pages, revision reminders..."
                  className="input-field"
                  style={{ width: "100%", fontSize: "0.88rem", resize: "vertical" }}
                />
              </div>

              {formError && (
                <div
                  style={{
                    background: "rgba(244, 63, 94, 0.15)",
                    border: "1px solid rgba(244, 63, 94, 0.4)",
                    color: "#fda4af",
                    padding: "10px 14px",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "0.85rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <AlertCircle size={16} />
                  <span>{formError}</span>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-secondary"
                  disabled={isSaving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSaving}
                  style={{ minWidth: "140px", gap: "6px" }}
                >
                  {isSaving ? (
                    <>
                      <span className="spinner" style={{ width: "14px", height: "14px" }} />
                      <span>Saving Note...</span>
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      <span>Save & Preview</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Rename & Edit Modal */}
      {showEditModal && activeNoteForAction && (
        <div className="modal-backdrop" onClick={() => setShowEditModal(false)}>
          <div
            className="modal-content glass-panel"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "520px", width: "95%", padding: "clamp(20px, 4vw, 28px)" }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Edit3 size={20} style={{ color: "var(--accent-primary)" }} />
                <h3 style={{ fontSize: "1.15rem", fontWeight: "700" }}>Rename & Edit Note</h3>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", marginBottom: "6px" }}>
                  Title / Display Name
                </label>
                <input
                  type="text"
                  required
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="input-field"
                  style={{ width: "100%", fontSize: "0.9rem" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", marginBottom: "6px" }}>
                    PDF File Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.file_name}
                    onChange={(e) => setEditForm({ ...editForm, file_name: e.target.value })}
                    className="input-field"
                    style={{ width: "100%", fontSize: "0.88rem" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", marginBottom: "6px" }}>
                    Folder / Category
                  </label>
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    className="input-field"
                    style={{ width: "100%", fontSize: "0.88rem" }}
                  >
                    {DEFAULT_CATEGORIES.filter((c) => c !== "All").map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                    <option value="Custom">+ Custom Folder...</option>
                  </select>
                </div>
              </div>

              {editForm.category === "Custom" && (
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", marginBottom: "6px" }}>
                    Custom Folder Name
                  </label>
                  <input
                    type="text"
                    value={editForm.custom_category}
                    onChange={(e) => setEditForm({ ...editForm, custom_category: e.target.value })}
                    className="input-field"
                    style={{ width: "100%", fontSize: "0.88rem" }}
                  />
                </div>
              )}

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", marginBottom: "6px" }}>
                  Description / Notes
                </label>
                <textarea
                  rows={2}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="input-field"
                  style={{ width: "100%", fontSize: "0.88rem", resize: "vertical" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "6px" }}>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="btn btn-secondary"
                  disabled={isUpdating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isUpdating}
                  style={{ minWidth: "120px" }}
                >
                  {isUpdating ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Delete Confirmation Modal with Required Security Password */}
      {showDeleteModal && activeNoteForAction && (
        <div className="modal-backdrop" onClick={() => setShowDeleteModal(false)}>
          <div
            className="modal-content glass-panel"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "480px",
              width: "95%",
              padding: "clamp(20px, 4vw, 28px)",
              border: "1px solid rgba(244, 63, 94, 0.4)",
              boxShadow: "0 20px 50px rgba(244, 63, 94, 0.2)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "50%",
                  background: "rgba(244, 63, 94, 0.2)",
                  border: "1px solid rgba(244, 63, 94, 0.4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#f43f5e",
                  flexShrink: 0,
                }}
              >
                <ShieldAlert size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: "1.2rem", fontWeight: "700", color: "#fda4af" }}>
                  Delete Protection
                </h3>
                <p style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                  Enter password to save from deleting by mistake
                </p>
              </div>
            </div>

            {/* Note details snippet */}
            <div
              style={{
                background: "rgba(0, 0, 0, 0.3)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-md)",
                padding: "12px 14px",
                marginBottom: "16px",
              }}
            >
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "4px" }}>
                Target Note:
              </div>
              <div style={{ fontWeight: "700", fontSize: "0.95rem", color: "var(--text-primary)", marginBottom: "2px" }}>
                {activeNoteForAction.title}
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--accent-cyan)", fontFamily: "monospace" }}>
                📄 {activeNoteForAction.file_name} • {activeNoteForAction.category}
              </div>
            </div>

            <form onSubmit={handleDeleteConfirm} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.86rem", fontWeight: "600", marginBottom: "6px" }}>
                  Security Password <span style={{ color: "#f43f5e" }}>*</span>
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showDeletePassword ? "text" : "password"}
                    value={deletePassword}
                    onChange={(e) => {
                      setDeletePassword(e.target.value);
                      setDeleteError("");
                    }}
                    placeholder="Enter security password to confirm"
                    className="input-field"
                    style={{
                      width: "100%",
                      paddingRight: "40px",
                      fontSize: "0.95rem",
                      borderColor: deleteError ? "rgba(244, 63, 94, 0.6)" : "var(--border-subtle)",
                    }}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowDeletePassword(!showDeletePassword)}
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    {showDeletePassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "6px", fontSize: "0.78rem", color: "var(--text-muted)" }}>
                  <Lock size={12} />
                  <span>Security protection enabled to prevent accidental deletion</span>
                </div>
              </div>

              {deleteError && (
                <div
                  style={{
                    background: "rgba(244, 63, 94, 0.15)",
                    border: "1px solid rgba(244, 63, 94, 0.4)",
                    color: "#fda4af",
                    padding: "10px 12px",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "0.82rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <AlertCircle size={15} />
                  <span>{deleteError}</span>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="btn btn-secondary"
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-danger"
                  disabled={isDeleting || !deletePassword}
                  style={{ minWidth: "130px", gap: "6px" }}
                >
                  {isDeleting ? (
                    <>
                      <span className="spinner" style={{ width: "14px", height: "14px" }} />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} />
                      <span>Confirm Delete</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. Fullscreen PDF Reading Modal */}
      {showFullscreenModal && activeNote && (
        <div
          className="modal-backdrop"
          onClick={() => setShowFullscreenModal(false)}
          style={{ padding: "10px", zIndex: 9999 }}
        >
          <div
            className="glass-panel"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "98vw",
              height: "96vh",
              display: "flex",
              flexDirection: "column",
              padding: "14px",
              background: "rgba(10, 15, 29, 0.98)",
              border: "1px solid var(--accent-primary)",
              borderRadius: "var(--radius-lg)",
            }}
          >
            {/* Modal Top Bar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                paddingBottom: "10px",
                borderBottom: "1px solid var(--border-subtle)",
                marginBottom: "10px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <FileText size={20} style={{ color: "#fb7185" }} />
                <div>
                  <h3 style={{ fontSize: "1.05rem", fontWeight: "700", color: "#fff" }}>
                    {activeNote.title}
                  </h3>
                  <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                    {activeNote.file_name} • {activeNote.category}
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <a
                  href={activeNote.view_url || activeNote.gdrive_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                  style={{ padding: "6px 12px", fontSize: "0.82rem", gap: "6px" }}
                >
                  <ExternalLink size={14} />
                  <span>Open Drive</span>
                </a>

                <button
                  onClick={() => setShowFullscreenModal(false)}
                  className="btn btn-secondary"
                  style={{ padding: "6px 12px", gap: "6px" }}
                >
                  <Minimize2 size={16} />
                  <span>Exit Fullscreen</span>
                </button>
              </div>
            </div>

            {/* Maximized PDF Viewer iFrame */}
            <div style={{ flex: 1, width: "100%", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
              <iframe
                title={`Fullscreen preview of ${activeNote.title}`}
                src={activeNote.preview_url}
                width="100%"
                height="100%"
                allow="autoplay"
                style={{ border: "none", width: "100%", height: "100%", display: "block" }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
