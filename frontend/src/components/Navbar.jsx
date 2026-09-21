import React from "react";
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
  Trash2
} from "lucide-react";

export default function Navbar({ activeTab, onTabChange, configStatus, onResetStorage }) {
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "gd", label: "GD Practice", icon: Users },
    { id: "hr", label: "HR Interview", icon: Briefcase },
    { id: "resume", label: "Resume Round", icon: FileCode2 },
    { id: "analytics", label: "Analytics & History", icon: TrendingUp },
  ];

  const isConfigured = configStatus?.is_configured;
  const activeModel = configStatus?.active_model || "openai/gpt-oss-120b";

  return (
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
            <Sparkles size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: "1.3rem", fontWeight: "800", letterSpacing: "-0.03em" }}>
              Prep<span style={{ color: "var(--accent-primary)" }}>AI</span>
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
              Placement Coach
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            background: "rgba(255, 255, 255, 0.03)",
            padding: "5px",
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

        {/* Status Pill & Clear Storage */}
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

          {isConfigured ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 12px",
                background: "rgba(16, 185, 129, 0.1)",
                border: "1px solid rgba(16, 185, 129, 0.25)",
                borderRadius: "var(--radius-full)",
                fontSize: "0.78rem",
                color: "#6ee7b7",
              }}
              title={`LLM Model: ${activeModel}`}
            >
              <CheckCircle2 size={14} color="#10b981" />
              <span style={{ fontWeight: "600" }}>Groq Active</span>
              <span style={{ color: "var(--text-muted)", fontSize: "0.72rem" }}>({activeModel.split("/").pop()})</span>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 12px",
                background: "rgba(245, 158, 11, 0.12)",
                border: "1px solid rgba(245, 158, 11, 0.3)",
                borderRadius: "var(--radius-full)",
                fontSize: "0.78rem",
                color: "#fcd34d",
              }}
              title="Add your free GROQ_API_KEY in backend/.env"
            >
              <AlertCircle size={14} color="#f59e0b" />
              <span style={{ fontWeight: "600" }}>Add API Key</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
