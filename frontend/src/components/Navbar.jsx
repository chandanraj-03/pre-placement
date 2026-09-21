import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  FileCode2,
  TrendingUp,
  Sparkles,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Settings,
  Link2,
  X,
  ExternalLink,
  Server,
  RefreshCw,
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
  const [backendUrlInput, setBackendUrlInput] = useState("");
  const [testState, setTestState] = useState({
    loading: false,
    success: null,
    message: "",
  });

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "gd", label: "GD Practice", icon: Users },
    { id: "hr", label: "HR Interview", icon: Briefcase },
    { id: "resume", label: "Resume Round", icon: FileCode2 },
    { id: "analytics", label: "Analytics & History", icon: TrendingUp },
  ];

  const isConfigured = configStatus?.is_configured;
  const activeModel = configStatus?.active_model || "openai/gpt-oss-120b";
  const currentBaseUrl = getApiBaseUrl();

  useEffect(() => {
    if (showModal) {
      setBackendUrlInput(getApiBaseUrl());
      setTestState({ loading: false, success: null, message: "" });
    }
  }, [showModal]);

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
          background: "rgba(10, 13, 23, 0.85)",
          backdropFilter: "blur(18px)",
          borderBottom: "1px solid var(--border-subtle)",
          padding: "0 24px",
        }}
      >
        <div
          style={{
            maxWidth: "1400px",
            margin: "0 auto",
            height: "72px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "20px",
          }}
        >
          {/* Logo & Brand */}
          <div
            onClick={() => onTabChange("dashboard")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              cursor: "pointer",
              userSelect: "none",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "12px",
                background: "var(--gradient-primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 20px rgba(99, 102, 241, 0.4)",
              }}
            >
              <Sparkles size={20} color="#ffffff" />
            </div>
            <div>
              <div
                style={{
                  fontSize: "1.25rem",
                  fontWeight: "800",
                  fontFamily: "var(--font-heading)",
                  letterSpacing: "-0.02em",
                  background: "linear-gradient(135deg, #ffffff 30%, #a5b4fc 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                PrepAI
              </div>
              <div
                style={{
                  fontSize: "0.68rem",
                  color: "var(--text-muted)",
                  letterSpacing: "0.08em",
                  fontWeight: "600",
                  textTransform: "uppercase",
                }}
              >
                Placement Coach
              </div>
            </div>
          </div>

          {/* Nav Links */}
          <nav
            style={{
              display: "flex",
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

          {/* Right Action Area */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
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
        </div>
      </header>

      {/* Backend & API Settings Modal */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-medium)",
              borderRadius: "16px",
              padding: "28px",
              maxWidth: "560px",
              width: "100%",
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.6)",
              color: "var(--text-primary)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "20px",
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
                  <Server size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: "700" }}>
                    Backend Connection Settings
                  </h3>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    Connect to your FastAPI server on Render or localhost
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

            {/* Current Target URL Indicator */}
            <div
              style={{
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "10px",
                padding: "12px 14px",
                marginBottom: "20px",
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
                  : "○ Not responding or missing GROQ_API_KEY on the backend"}
              </div>
            </div>

            {/* Backend URL Input Form */}
            <form onSubmit={handleTestAndSave} style={{ marginBottom: "20px" }}>
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
                  marginBottom: "20px",
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
                <li>
                  Open your <strong>Render Dashboard</strong> (dashboard.render.com).
                </li>
                <li>
                  Click on <strong>prepai-backend</strong>.
                </li>
                <li>
                  Copy the URL right under the title (e.g.{" "}
                  <code style={{ background: "rgba(0,0,0,0.3)", padding: "1px 4px", borderRadius: "4px" }}>
                    https://prepai-backend-xxxx.onrender.com
                  </code>
                  ).
                </li>
                <li>
                  Ensure <strong>GROQ_API_KEY</strong> is set under the <strong>Environment</strong> tab of{" "}
                  <code>prepai-backend</code>.
                </li>
                <li>Paste it above and click <strong>Connect</strong>!</li>
              </ol>
            </div>

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
