import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  FileCode2,
  TrendingUp,
  BookOpen,
  Sparkles,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Settings,
  Link2,
  X,
  Menu,
  ExternalLink,
  Server,
  RefreshCw,
  Eye,
  EyeOff,
  Check,
} from "lucide-react";
import { api, getApiBaseUrl, setCustomBackendUrl } from "../api/client";

export default function Navbar({
  activeTab,
  onTabChange,
  configStatus,
  onResetStorage,
  onRefreshConfig,
}) {
  const [showModal, setShowModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [modalTab, setModalTab] = useState("groq"); // "groq" | "backend"
  const [backendUrlInput, setBackendUrlInput] = useState("");
  const [testState, setTestState] = useState({
    loading: false,
    success: null,
    message: "",
  });

  const [groqKeyInput, setGroqKeyInput] = useState("");
  const [showKeyText, setShowKeyText] = useState(false);
  const [keyState, setKeyState] = useState({
    loading: false,
    success: null,
    message: "",
  });

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "gd", label: "GD Practice", icon: Users },
    { id: "hr", label: "HR Interview", icon: Briefcase },
    { id: "resume", label: "Resume Round", icon: FileCode2 },
    { id: "notes", label: "Notes", icon: BookOpen },
    { id: "analytics", label: "Analytics & History", icon: TrendingUp },
  ];

  const isConfigured = configStatus?.is_configured;
  const activeModel = configStatus?.active_model || "openai/gpt-oss-120b";
  const maskedKey = configStatus?.masked_key || "";
  const currentBaseUrl = getApiBaseUrl();

  useEffect(() => {
    if (showModal) {
      setBackendUrlInput(getApiBaseUrl());
      setTestState({ loading: false, success: null, message: "" });
      setGroqKeyInput("");
      setKeyState({ loading: false, success: null, message: "" });
      setModalTab(isConfigured ? "groq" : "groq");
    }
  }, [showModal, isConfigured]);

  const handleSaveGroqKey = async (e) => {
    if (e) e.preventDefault();
    const cleanKey = groqKeyInput.trim();
    if (!cleanKey) {
      setKeyState({ loading: false, success: false, message: "Please enter your Groq API key." });
      return;
    }

    if (!cleanKey.startsWith("gsk_")) {
      setKeyState({
        loading: false,
        success: false,
        message: "Invalid key format. Groq API keys start with 'gsk_'.",
      });
      return;
    }

    setKeyState({
      loading: true,
      success: null,
      message: "Validating API key with Groq servers...",
    });

    try {
      const res = await api.setGroqApiKey(cleanKey);
      if (res && res.success) {
        setKeyState({
          loading: false,
          success: true,
          message: res.message || "Groq API key verified and activated successfully!",
        });
        setGroqKeyInput("");
        if (onRefreshConfig) onRefreshConfig();
      } else {
        setKeyState({
          loading: false,
          success: false,
          message: "Failed to save Groq API key.",
        });
      }
    } catch (err) {
      setKeyState({
        loading: false,
        success: false,
        message: `Validation failed: ${err.message}`,
      });
    }
  };

  const handleTestAndSave = async (e) => {
    if (e) e.preventDefault();
    if (!backendUrlInput.trim()) return;

    setTestState({ loading: true, success: null, message: "Testing connection to backend..." });
    try {
      const res = await api.testBackendUrl(backendUrlInput);
      if (res && res.success) {
        setCustomBackendUrl(backendUrlInput);
        const msg = res.is_configured
          ? `Connected successfully! Model: ${res.active_model} (Groq Key Active)`
          : "Connected to backend! Note: GROQ_API_KEY is not set yet in your Render environment variables.";
        setTestState({
          loading: false,
          success: true,
          message: msg,
        });
        if (onRefreshConfig) onRefreshConfig();
      } else {
        setTestState({
          loading: false,
          success: false,
          message: "Backend reached but responded with an error.",
        });
      }
    } catch (err) {
      setTestState({
        loading: false,
        success: false,
        message: `Connection failed: ${err.message}. If the Render backend was just deployed or went to sleep, wait 30-45 seconds for it to wake up.`,
      });
    }
  };

  const handleResetDefault = () => {
    setCustomBackendUrl(null);
    const def = getApiBaseUrl();
    setBackendUrlInput(def);
    setTestState({
      loading: false,
      success: true,
      message: "Reset to default build URL.",
    });
    if (onRefreshConfig) onRefreshConfig();
  };

  return (
    <>
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "rgba(10, 13, 23, 0.88)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          borderBottom: "1px solid var(--border-subtle)",
          padding: "0 16px",
        }}
      >
        <div
          style={{
            maxWidth: "1400px",
            margin: "0 auto",
            minHeight: "64px",
            height: "auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            padding: "8px 0",
          }}
        >
          {/* Logo & Brand */}
          <div
            onClick={() => {
              onTabChange("dashboard");
              setMobileMenuOpen(false);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              cursor: "pointer",
              userSelect: "none",
            }}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "var(--gradient-primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 16px rgba(99, 102, 241, 0.4)",
                flexShrink: 0,
              }}
            >
              <Sparkles size={18} color="#ffffff" />
            </div>
            <div>
              <div
                style={{
                  fontSize: "1.15rem",
                  fontWeight: "800",
                  fontFamily: "var(--font-heading)",
                  letterSpacing: "-0.02em",
                  background: "linear-gradient(135deg, #ffffff 30%, #a5b4fc 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  lineHeight: "1.2",
                }}
              >
                PrepAI
              </div>
              <div
                style={{
                  fontSize: "0.64rem",
                  color: "var(--text-muted)",
                  letterSpacing: "0.08em",
                  fontWeight: "600",
                  textTransform: "uppercase",
                }}
              >
                Placement Coach
              </div>
            </div>

            <span
              className="mobile-only"
              style={{
                fontSize: "0.72rem",
                padding: "3px 8px",
                borderRadius: "var(--radius-full)",
                background: "rgba(99, 102, 241, 0.18)",
                border: "1px solid rgba(99, 102, 241, 0.35)",
                color: "#c7d2fe",
                fontWeight: "600",
                marginLeft: "6px",
                whiteSpace: "nowrap",
                maxWidth: "110px",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {activeTab === "dashboard"
                ? "Home"
                : activeTab === "gd"
                ? "GD Prep"
                : activeTab === "hr"
                ? "HR Round"
                : activeTab === "resume"
                ? "Resume"
                : activeTab === "notes"
                ? "Notes"
                : "Stats"}
            </span>
          </div>

          {/* Desktop Nav Links */}
          <nav
            className="desktop-only"
            style={{
              alignItems: "center",
              gap: "4px",
              background: "rgba(255, 255, 255, 0.03)",
              padding: "4px",
              borderRadius: "var(--radius-full)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 16px",
                    borderRadius: "var(--radius-full)",
                    fontSize: "0.88rem",
                    fontWeight: isActive ? "600" : "500",
                    color: isActive ? "#ffffff" : "var(--text-secondary)",
                    background: isActive ? "var(--gradient-primary)" : "transparent",
                    boxShadow: isActive ? "0 4px 14px rgba(99, 102, 241, 0.35)" : "none",
                    border: "none",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    outline: "none",
                  }}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Desktop Right Action Area */}
          <div className="desktop-only" style={{ alignItems: "center", gap: "10px" }}>
            {onResetStorage && (
              <button
                onClick={onResetStorage}
                className="btn btn-secondary"
                style={{
                  padding: "6px 12px",
                  fontSize: "0.78rem",
                  gap: "6px",
                  borderRadius: "var(--radius-full)",
                  color: "var(--text-muted)",
                  minHeight: "unset",
                }}
                title="Clear all stored session and resume JSON files to manage local disk space"
              >
                <Trash2 size={13} />
                <span>Clear Storage</span>
              </button>
            )}

            {/* Clickable Connection / API Pill */}
            {isConfigured ? (
              <button
                onClick={() => setShowModal(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 14px",
                  background: "rgba(16, 185, 129, 0.1)",
                  border: "1px solid rgba(16, 185, 129, 0.3)",
                  borderRadius: "var(--radius-full)",
                  fontSize: "0.78rem",
                  color: "#6ee7b7",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                title={`Backend: ${currentBaseUrl}\nClick to view/change backend settings`}
              >
                <CheckCircle2 size={14} color="#10b981" />
                <span style={{ fontWeight: "600" }}>Groq Active</span>
                <span style={{ color: "var(--text-muted)", fontSize: "0.72rem" }}>
                  ({activeModel.split("/").pop()})
                </span>
                <Settings size={12} style={{ opacity: 0.6, marginLeft: "2px" }} />
              </button>
            ) : (
              <button
                onClick={() => setShowModal(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 14px",
                  background: "rgba(245, 158, 11, 0.12)",
                  border: "1px solid rgba(245, 158, 11, 0.4)",
                  borderRadius: "var(--radius-full)",
                  fontSize: "0.78rem",
                  color: "#fcd34d",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                title="Click to configure Backend URL or Groq API Key"
              >
                <AlertCircle size={14} color="#f59e0b" />
                <span style={{ fontWeight: "600" }}>Backend Connection</span>
                <Settings size={12} style={{ opacity: 0.8, marginLeft: "2px" }} />
              </button>
            )}
          </div>

          {/* Mobile Right Controls: Status Pill + Hamburger Toggle */}
          <div className="mobile-only" style={{ alignItems: "center", gap: "8px" }}>
            <button
              onClick={() => setShowModal(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "6px 10px",
                background: isConfigured ? "rgba(16, 185, 129, 0.12)" : "rgba(245, 158, 11, 0.15)",
                border: isConfigured ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(245, 158, 11, 0.3)",
                borderRadius: "var(--radius-full)",
                fontSize: "0.75rem",
                fontWeight: "600",
                color: isConfigured ? "#6ee7b7" : "#fcd34d",
                cursor: "pointer",
              }}
              title="Configure Groq API or Backend"
            >
              {isConfigured ? <CheckCircle2 size={13} color="#10b981" /> : <AlertCircle size={13} color="#f59e0b" />}
              <span>{isConfigured ? "Live" : "Setup"}</span>
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                padding: "8px",
                background: "rgba(255, 255, 255, 0.06)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "10px",
                color: "var(--text-primary)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minWidth: "40px",
                minHeight: "40px",
              }}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Slide-down / Full Overlay Drawer - Outside header to avoid stacking context entrapment */}
      {mobileMenuOpen && (
        <div
          style={{
            position: "fixed",
            top: "60px",
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999,
            background: "rgba(10, 13, 23, 0.98)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            padding: "20px 16px 90px 16px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            overflowY: "auto",
            borderTop: "1px solid var(--border-subtle)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
            <div style={{ fontSize: "0.76rem", fontWeight: "700", textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.08em" }}>
              Practice Rounds & Study Tools
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              style={{
                background: "none",
                border: "none",
                color: "var(--text-muted)",
                cursor: "pointer",
                padding: "4px",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "0.8rem",
              }}
            >
              <X size={16} />
              <span>Close</span>
            </button>
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  setMobileMenuOpen(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "13px 16px",
                  borderRadius: "var(--radius-md)",
                  fontSize: "0.98rem",
                  fontWeight: isActive ? "700" : "500",
                  color: isActive ? "#ffffff" : "var(--text-primary)",
                  background: isActive ? "var(--gradient-primary)" : "rgba(255, 255, 255, 0.04)",
                  border: isActive ? "none" : "1px solid var(--border-subtle)",
                  boxShadow: isActive ? "0 4px 14px rgba(99, 102, 241, 0.35)" : "none",
                  cursor: "pointer",
                  textAlign: "left",
                  width: "100%",
                }}
              >
                <Icon size={19} color={isActive ? "#ffffff" : "var(--accent-primary)"} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.id === "notes" && (
                  <span className="badge badge-indigo" style={{ fontSize: "0.68rem" }}>
                    PDFs
                  </span>
                )}
              </button>
            );
          })}

          <div style={{ height: "1px", background: "var(--border-subtle)", margin: "8px 0" }} />

          <div style={{ fontSize: "0.76rem", fontWeight: "700", textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.08em" }}>
            Controls & Configuration
          </div>

          <button
            onClick={() => {
              setShowModal(true);
              setMobileMenuOpen(false);
            }}
            className="btn btn-secondary"
            style={{ width: "100%", justifyContent: "flex-start", padding: "12px 16px", gap: "10px", fontSize: "0.92rem" }}
          >
            <Settings size={18} color="var(--accent-cyan)" />
            <span>Groq Key & Backend URL</span>
          </button>

          {onResetStorage && (
            <button
              onClick={() => {
                onResetStorage();
                setMobileMenuOpen(false);
              }}
              className="btn btn-secondary"
              style={{ width: "100%", justifyContent: "flex-start", padding: "12px 16px", gap: "10px", color: "var(--accent-rose)", fontSize: "0.92rem" }}
            >
              <Trash2 size={18} />
              <span>Clear Stored Practice History</span>
            </button>
          )}
        </div>
      )}

      {/* Mobile Bottom Navigation Bar - Thumb-friendly 1-tap switching on mobile */}
      <nav className="mobile-bottom-nav" aria-label="Mobile Bottom Navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const shortLabel =
            item.id === "dashboard"
              ? "Home"
              : item.id === "gd"
              ? "GD"
              : item.id === "hr"
              ? "HR"
              : item.id === "resume"
              ? "Resume"
              : item.id === "notes"
              ? "Notes"
              : "Stats";

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              style={{
                background: "none",
                border: "none",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "2px",
                padding: "4px 2px",
                flex: 1,
                cursor: "pointer",
                color: isActive ? "#ffffff" : "var(--text-muted)",
                transition: "all 0.15s ease",
                minWidth: 0,
                outline: "none",
              }}
            >
              <div
                style={{
                  padding: "4px 10px",
                  borderRadius: "var(--radius-full)",
                  background: isActive ? "var(--gradient-primary)" : "transparent",
                  boxShadow: isActive ? "0 2px 10px rgba(99, 102, 241, 0.4)" : "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s ease",
                }}
              >
                <Icon size={18} color={isActive ? "#ffffff" : "var(--text-muted)"} />
              </div>
              <span
                style={{
                  fontSize: "0.68rem",
                  fontWeight: isActive ? "700" : "500",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxWidth: "100%",
                  color: isActive ? "#c7d2fe" : "var(--text-muted)",
                }}
              >
                {shortLabel}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Backend & API Settings Modal */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(0, 0, 0, 0.78)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
            overflowY: "auto",
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-medium)",
              borderRadius: "16px",
              padding: "20px 18px",
              maxWidth: "560px",
              width: "100%",
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.6)",
              color: "var(--text-primary)",
              maxHeight: "90vh",
              overflowY: "auto",
              boxSizing: "border-box",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "16px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    padding: "8px",
                    borderRadius: "10px",
                    background: "rgba(99, 102, 241, 0.15)",
                    color: "var(--primary-light)",
                  }}
                >
                  <Settings size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: "700" }}>
                    System & API Configuration
                  </h3>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    Configure Groq AI key and backend server connection
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  padding: "4px",
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div
              style={{
                display: "flex",
                gap: "8px",
                marginBottom: "20px",
                borderBottom: "1px solid var(--border-subtle)",
                paddingBottom: "10px",
              }}
            >
              <button
                type="button"
                onClick={() => setModalTab("groq")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 14px",
                  borderRadius: "8px",
                  background: modalTab === "groq" ? "rgba(99, 102, 241, 0.15)" : "transparent",
                  color: modalTab === "groq" ? "#a5b4fc" : "var(--text-secondary)",
                  border: modalTab === "groq" ? "1px solid rgba(99, 102, 241, 0.35)" : "1px solid transparent",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "0.84rem",
                  transition: "all 0.15s ease",
                }}
              >
                <KeyRound size={15} />
                <span>Groq API Key</span>
                {isConfigured ? (
                  <span
                    style={{
                      fontSize: "0.68rem",
                      background: "rgba(16, 185, 129, 0.2)",
                      color: "#34d399",
                      padding: "2px 7px",
                      borderRadius: "10px",
                      fontWeight: "700",
                    }}
                  >
                    Active
                  </span>
                ) : (
                  <span
                    style={{
                      fontSize: "0.68rem",
                      background: "rgba(245, 158, 11, 0.2)",
                      color: "#fbbf24",
                      padding: "2px 7px",
                      borderRadius: "10px",
                      fontWeight: "700",
                    }}
                  >
                    Required
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setModalTab("backend")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 14px",
                  borderRadius: "8px",
                  background: modalTab === "backend" ? "rgba(99, 102, 241, 0.15)" : "transparent",
                  color: modalTab === "backend" ? "#a5b4fc" : "var(--text-secondary)",
                  border: modalTab === "backend" ? "1px solid rgba(99, 102, 241, 0.35)" : "1px solid transparent",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "0.84rem",
                  transition: "all 0.15s ease",
                }}
              >
                <Server size={15} />
                <span>Backend URL</span>
              </button>
            </div>

            {/* TAB 1: GROQ API KEY CONFIGURATION */}
            {modalTab === "groq" && (
              <div>
                {/* Active Key Status Card */}
                <div
                  style={{
                    background: isConfigured ? "rgba(16, 185, 129, 0.08)" : "rgba(245, 158, 11, 0.08)",
                    border: isConfigured ? "1px solid rgba(16, 185, 129, 0.25)" : "1px solid rgba(245, 158, 11, 0.3)",
                    borderRadius: "10px",
                    padding: "12px 14px",
                    marginBottom: "18px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      {isConfigured ? (
                        <CheckCircle2 size={16} color="#10b981" />
                      ) : (
                        <AlertCircle size={16} color="#f59e0b" />
                      )}
                      <span
                        style={{
                          fontWeight: "600",
                          color: isConfigured ? "#6ee7b7" : "#fcd34d",
                          fontSize: "0.85rem",
                        }}
                      >
                        {isConfigured ? "Groq API Key Configured & Active" : "No Groq API Key Configured"}
                      </span>
                    </div>
                    {isConfigured && maskedKey && (
                      <span
                        style={{
                          fontFamily: "monospace",
                          fontSize: "0.78rem",
                          color: "#6ee7b7",
                          background: "rgba(0, 0, 0, 0.35)",
                          padding: "3px 8px",
                          borderRadius: "6px",
                          border: "1px solid rgba(16, 185, 129, 0.2)",
                        }}
                      >
                        {maskedKey}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: "0.76rem", color: "var(--text-muted)", marginTop: "6px" }}>
                    {isConfigured ? (
                      <>Active LLM Model: <code style={{ color: "#c7d2fe" }}>{activeModel}</code> | Speech: <code style={{ color: "#c7d2fe" }}>Whisper Large v3</code></>
                    ) : (
                      "Provide your key to enable AI Group Discussion topics, interview scoring, and Whisper speech transcription."
                    )}
                  </div>
                </div>

                {/* Groq Key Input Form */}
                <form onSubmit={handleSaveGroqKey} style={{ marginBottom: "18px" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.85rem",
                      fontWeight: "600",
                      marginBottom: "8px",
                    }}
                  >
                    {isConfigured ? "Update Groq API Key" : "Enter Groq API Key"}
                  </label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <div style={{ flex: 1, position: "relative" }}>
                      <input
                        type={showKeyText ? "text" : "password"}
                        value={groqKeyInput}
                        onChange={(e) => setGroqKeyInput(e.target.value)}
                        placeholder="gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                        autoComplete="off"
                        spellCheck="false"
                        style={{
                          width: "100%",
                          padding: "10px 42px 10px 14px",
                          borderRadius: "10px",
                          background: "rgba(15, 23, 42, 0.8)",
                          border: "1px solid var(--border-medium)",
                          color: "#ffffff",
                          fontSize: "0.88rem",
                          fontFamily: showKeyText ? "monospace" : "inherit",
                          outline: "none",
                          boxSizing: "border-box",
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowKeyText(!showKeyText)}
                        style={{
                          position: "absolute",
                          right: "10px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          background: "transparent",
                          border: "none",
                          color: "var(--text-muted)",
                          cursor: "pointer",
                          padding: "4px",
                          display: "flex",
                          alignItems: "center",
                        }}
                        title={showKeyText ? "Hide API key" : "Show API key"}
                      >
                        {showKeyText ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <button
                      type="submit"
                      disabled={keyState.loading || !groqKeyInput.trim()}
                      className="btn btn-primary"
                      style={{ padding: "10px 18px", fontSize: "0.85rem", gap: "6px", whiteSpace: "nowrap" }}
                    >
                      {keyState.loading ? (
                        <>
                          <RefreshCw size={14} className="spin" />
                          <span>Verifying...</span>
                        </>
                      ) : (
                        <>
                          <Check size={14} />
                          <span>Save & Test</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {/* Key Status Feedback Banner */}
                {keyState.message && (
                  <div
                    style={{
                      padding: "12px 14px",
                      borderRadius: "10px",
                      marginBottom: "18px",
                      fontSize: "0.82rem",
                      lineHeight: "1.4",
                      background:
                        keyState.success === true
                          ? "rgba(16, 185, 129, 0.12)"
                          : "rgba(239, 68, 68, 0.12)",
                      border:
                        keyState.success === true
                          ? "1px solid rgba(16, 185, 129, 0.3)"
                          : "1px solid rgba(239, 68, 68, 0.3)",
                      color: keyState.success === true ? "#6ee7b7" : "#fca5a5",
                    }}
                  >
                    {keyState.message}
                  </div>
                )}

                {/* Groq Key Instructions */}
                <div
                  style={{
                    background: "rgba(99, 102, 241, 0.05)",
                    border: "1px solid rgba(99, 102, 241, 0.2)",
                    borderRadius: "10px",
                    padding: "14px",
                    fontSize: "0.8rem",
                    lineHeight: "1.5",
                    color: "var(--text-secondary)",
                  }}
                >
                  <div style={{ fontWeight: "700", color: "#c7d2fe", marginBottom: "6px" }}>
                    How to obtain a free Groq API Key:
                  </div>
                  <ol style={{ margin: 0, paddingLeft: "18px" }}>
                    <li>
                      Visit{" "}
                      <a
                        href="https://console.groq.com/keys"
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          color: "var(--accent-primary)",
                          textDecoration: "underline",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "3px",
                        }}
                      >
                        console.groq.com/keys <ExternalLink size={11} />
                      </a>{" "}
                      and sign in (free tier, no credit card required).
                    </li>
                    <li>Click <strong>Create API Key</strong> and copy the key (starts with <code>gsk_</code>).</li>
                    <li>Paste it above and click <strong>Save & Test</strong>. The key is verified live with Groq and activated immediately.</li>
                  </ol>
                </div>
              </div>
            )}

            {/* TAB 2: BACKEND URL CONFIGURATION */}
            {modalTab === "backend" && (
              <div>
                {/* Current Target URL Indicator */}
                <div
                  style={{
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "10px",
                    padding: "12px 14px",
                    marginBottom: "18px",
                    fontSize: "0.82rem",
                  }}
                >
                  <div style={{ color: "var(--text-muted)", marginBottom: "4px" }}>
                    Active Target Backend:
                  </div>
                  <div
                    style={{
                      fontFamily: "monospace",
                      color: isConfigured ? "#34d399" : "#fbbf24",
                      fontWeight: "600",
                      wordBreak: "break-all",
                    }}
                  >
                    {currentBaseUrl}
                  </div>
                  <div style={{ marginTop: "6px", fontSize: "0.75rem", color: isConfigured ? "#34d399" : "#f87171" }}>
                    {isConfigured
                      ? "● Connected & Groq API key is configured"
                      : "○ Connected, but Groq API key is not configured"}
                  </div>
                </div>

                {/* Backend URL Input Form */}
                <form onSubmit={handleTestAndSave} style={{ marginBottom: "18px" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.85rem",
                      fontWeight: "600",
                      marginBottom: "8px",
                    }}
                  >
                    Render Backend URL
                  </label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input
                      type="text"
                      value={backendUrlInput}
                      onChange={(e) => setBackendUrlInput(e.target.value)}
                      placeholder="https://prepai-backend-xxxx.onrender.com"
                      style={{
                        flex: 1,
                        padding: "10px 14px",
                        borderRadius: "10px",
                        background: "rgba(15, 23, 42, 0.8)",
                        border: "1px solid var(--border-medium)",
                        color: "#ffffff",
                        fontSize: "0.88rem",
                        outline: "none",
                      }}
                    />
                    <button
                      type="submit"
                      disabled={testState.loading}
                      className="btn btn-primary"
                      style={{ padding: "10px 18px", fontSize: "0.85rem", gap: "6px" }}
                    >
                      {testState.loading ? (
                        <>
                          <RefreshCw size={14} className="spin" />
                          <span>Testing...</span>
                        </>
                      ) : (
                        <>
                          <Link2 size={14} />
                          <span>Connect</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {/* Status Feedback Banner */}
                {testState.message && (
                  <div
                    style={{
                      padding: "12px 14px",
                      borderRadius: "10px",
                      marginBottom: "18px",
                      fontSize: "0.82rem",
                      lineHeight: "1.4",
                      background:
                        testState.success === true
                          ? "rgba(16, 185, 129, 0.12)"
                          : "rgba(239, 68, 68, 0.12)",
                      border:
                        testState.success === true
                          ? "1px solid rgba(16, 185, 129, 0.3)"
                          : "1px solid rgba(239, 68, 68, 0.3)",
                      color: testState.success === true ? "#6ee7b7" : "#fca5a5",
                    }}
                  >
                    {testState.message}
                  </div>
                )}

                {/* Step-by-Step Instructions */}
                <div
                  style={{
                    background: "rgba(99, 102, 241, 0.05)",
                    border: "1px solid rgba(99, 102, 241, 0.2)",
                    borderRadius: "10px",
                    padding: "14px",
                    fontSize: "0.8rem",
                    lineHeight: "1.5",
                    color: "var(--text-secondary)",
                  }}
                >
                  <div style={{ fontWeight: "700", color: "#c7d2fe", marginBottom: "6px" }}>
                    How to find your Render backend URL:
                  </div>
                  <ol style={{ margin: 0, paddingLeft: "18px" }}>
                    <li>Open your <strong>Render Dashboard</strong> (dashboard.render.com).</li>
                    <li>Click on <strong>prepai-backend</strong>.</li>
                    <li>
                      Copy the URL under the title (e.g.{" "}
                      <code style={{ background: "rgba(0,0,0,0.3)", padding: "1px 4px", borderRadius: "4px" }}>
                        https://prepai-backend-xxxx.onrender.com
                      </code>
                      ).
                    </li>
                    <li>Paste it above and click <strong>Connect</strong>!</li>
                  </ol>
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: "20px",
                paddingTop: "16px",
                borderTop: "1px solid var(--border-subtle)",
              }}
            >
              <button
                type="button"
                onClick={handleResetDefault}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text-muted)",
                  fontSize: "0.78rem",
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                Reset to default build URL
              </button>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="btn btn-secondary"
                style={{ padding: "8px 18px", fontSize: "0.85rem" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
