import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  Award,
  Clock,
  Trash2,
  Eye,
  AlertTriangle,
  Volume2,
  Calendar,
  X,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  ChevronRight
} from "lucide-react";
import { api } from "../api/client";
import ScoreCard from "../components/ScoreCard";

export default function Analytics() {
  const [analytics, setAnalytics] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [modeFilter, setModeFilter] = useState("all");
  const [selectedSession, setSelectedSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [modeFilter]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [anaRes, sessRes] = await Promise.all([
        api.getAnalytics(),
        api.getSessions(50, modeFilter === "all" ? null : modeFilter),
      ]);
      if (anaRes.success) setAnalytics(anaRes.analytics);
      if (sessRes.success) setSessions(sessRes.sessions);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSession = async (id, e) => {
    e.stopPropagation();
    if (confirm("Delete this practice session record?")) {
      try {
        await api.deleteSession(id);
        if (selectedSession?.id === id) setSelectedSession(null);
        loadData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleOpenDetail = async (id) => {
    try {
      const res = await api.getSessionDetail(id);
      if (res.success && res.session) {
        setSelectedSession(res.session);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return "";
    const d = new Date(isoString);
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const scoreTrends = analytics?.score_trends || [];
  const firstSession = scoreTrends.length > 0 ? scoreTrends[0] : null;
  const latestSession = scoreTrends.length > 1 ? scoreTrends[scoreTrends.length - 1] : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
          <span className="badge badge-indigo">
            <TrendingUp size={12} /> Personal Performance Tracker
          </span>
          <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Stored Locally on Your Machine</span>
        </div>
        <h1 style={{ fontSize: "clamp(1.5rem, 4vw, 2rem)" }}>Progress & Analytics</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.92rem" }}>
          Track your communication growth, filler word reduction, and interview readiness over time.
        </p>
      </div>

      {/* Analytics KPI Row */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(clamp(140px, 45vw, 220px), 1fr))", gap: "14px" }}>
        <div className="glass-panel" style={{ padding: "16px 14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "var(--text-muted)", marginBottom: "6px" }}>
            <span style={{ fontSize: "0.76rem", fontWeight: "600", textTransform: "uppercase" }}>Total Practice Runs</span>
            <Award size={16} color="var(--accent-primary)" />
          </div>
          <div style={{ fontSize: "1.85rem", fontWeight: "800" }}>{analytics?.total_sessions || 0}</div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            GD: {analytics?.mode_counts?.gd || 0} • HR: {analytics?.mode_counts?.hr || 0} • Resume: {analytics?.mode_counts?.resume || 0}
          </span>
        </div>

        <div className="glass-panel" style={{ padding: "16px 14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "var(--text-muted)", marginBottom: "6px" }}>
            <span style={{ fontSize: "0.76rem", fontWeight: "600", textTransform: "uppercase" }}>Cumulative Average</span>
            <ShieldCheck size={16} color="var(--accent-emerald)" />
          </div>
          <div style={{ fontSize: "1.85rem", fontWeight: "800", color: (analytics?.overall_average || 0) >= 75 ? "var(--accent-emerald)" : "var(--accent-primary)" }}>
            {analytics?.overall_average ? `${analytics.overall_average}/100` : "N/A"}
          </div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Target threshold: 80+</span>
        </div>

        <div className="glass-panel" style={{ padding: "16px 14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "var(--text-muted)", marginBottom: "6px" }}>
            <span style={{ fontSize: "0.76rem", fontWeight: "600", textTransform: "uppercase" }}>Improvement Delta</span>
            <ArrowUpRight size={16} color="var(--accent-cyan)" />
          </div>
          <div style={{ fontSize: "1.85rem", fontWeight: "800", color: (analytics?.improvement_delta || 0) >= 0 ? "var(--accent-cyan)" : "var(--accent-rose)" }}>
            {(analytics?.improvement_delta || 0) > 0 ? `+${analytics.improvement_delta} pts` : "0 pts"}
          </div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Recent vs baseline</span>
        </div>
      </section>

      {/* Direct Comparison: Session #1 vs Latest Session */}
      {firstSession && latestSession && (
        <section
          className="glass-panel-glow"
          style={{
            padding: "clamp(16px, 3vw, 24px)",
            background: "linear-gradient(135deg, rgba(18, 25, 43, 0.9) 0%, rgba(26, 38, 70, 0.7) 100%)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px", flexWrap: "wrap" }}>
            <span className="badge badge-cyan">Growth Milestone</span>
            <h3 style={{ fontSize: "1.15rem" }}>First Attempt vs Latest Attempt</h3>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 250px), 1fr))", gap: "14px" }}>
            {/* Session 1 */}
            <div style={{ padding: "14px 16px", borderRadius: "var(--radius-md)", background: "rgba(0, 0, 0, 0.25)", border: "1px solid var(--border-subtle)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontWeight: "700", color: "var(--text-muted)", fontSize: "0.85rem" }}>Initial Session ({firstSession.mode.toUpperCase()})</span>
                <span style={{ fontWeight: "800", color: "var(--text-primary)" }}>{firstSession.overall}/100</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "0.84rem", color: "var(--text-secondary)" }}>
                <div>Fluency: <strong style={{ color: "var(--text-primary)" }}>{firstSession.fluency}</strong></div>
                <div>Grammar: <strong style={{ color: "var(--text-primary)" }}>{firstSession.grammar}</strong></div>
                <div>Vocabulary: <strong style={{ color: "var(--text-primary)" }}>{firstSession.vocabulary}</strong></div>
              </div>
            </div>

            {/* Latest Session */}
            <div style={{ padding: "14px 16px", borderRadius: "var(--radius-md)", background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.3)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontWeight: "700", color: "var(--accent-emerald)", fontSize: "0.85rem" }}>Latest Session ({latestSession.mode.toUpperCase()})</span>
                <span style={{ fontWeight: "800", color: "var(--accent-emerald)" }}>{latestSession.overall}/100</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "0.84rem", color: "var(--text-secondary)" }}>
                <div>
                  Fluency: <strong style={{ color: "var(--text-primary)" }}>{latestSession.fluency}</strong>{" "}
                  <span style={{ color: latestSession.fluency >= firstSession.fluency ? "var(--accent-emerald)" : "var(--accent-rose)", fontSize: "0.75rem" }}>
                    ({latestSession.fluency >= firstSession.fluency ? "+" : ""}{latestSession.fluency - firstSession.fluency})
                  </span>
                </div>
                <div>
                  Grammar: <strong style={{ color: "var(--text-primary)" }}>{latestSession.grammar}</strong>{" "}
                  <span style={{ color: latestSession.grammar >= firstSession.grammar ? "var(--accent-emerald)" : "var(--accent-rose)", fontSize: "0.75rem" }}>
                    ({latestSession.grammar >= firstSession.grammar ? "+" : ""}{latestSession.grammar - firstSession.grammar})
                  </span>
                </div>
                <div>
                  Vocabulary: <strong style={{ color: "var(--text-primary)" }}>{latestSession.vocabulary}</strong>{" "}
                  <span style={{ color: latestSession.vocabulary >= firstSession.vocabulary ? "var(--accent-emerald)" : "var(--accent-rose)", fontSize: "0.75rem" }}>
                    ({latestSession.vocabulary >= firstSession.vocabulary ? "+" : ""}{latestSession.vocabulary - firstSession.vocabulary})
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Aggregate Weaknesses & Fillers Section */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: "16px" }}>
        {/* Recurring Weaknesses */}
        <div className="glass-panel" style={{ padding: "18px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px", color: "var(--accent-amber)" }}>
            <AlertTriangle size={20} />
            <h3 style={{ fontSize: "1.1rem", color: "var(--text-primary)" }}>Common Recurring Weaknesses</h3>
          </div>
          {analytics?.common_weaknesses && analytics.common_weaknesses.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {analytics.common_weaknesses.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 14px",
                    background: "rgba(255, 255, 255, 0.03)",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--border-subtle)",
                    fontSize: "0.88rem",
                  }}
                >
                  <span style={{ color: "var(--text-secondary)" }}>{item.weakness}</span>
                  <span className="badge badge-amber" style={{ fontSize: "0.72rem" }}>
                    {item.count}x
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
              Complete more sessions to identify recurring weakness trends.
            </p>
          )}
        </div>

        {/* Top Filler Words */}
        <div className="glass-panel" style={{ padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px", color: "var(--accent-rose)" }}>
            <Volume2 size={20} />
            <h3 style={{ fontSize: "1.1rem", color: "var(--text-primary)" }}>Top Filler Words Used</h3>
          </div>
          {analytics?.top_filler_words && Object.keys(analytics.top_filler_words).length > 0 ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
              {Object.entries(analytics.top_filler_words).map(([word, count]) => (
                <div
                  key={word}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 14px",
                    borderRadius: "var(--radius-md)",
                    background: "rgba(244, 63, 94, 0.12)",
                    border: "1px solid rgba(244, 63, 94, 0.3)",
                    color: "#fda4af",
                  }}
                >
                  <span style={{ fontWeight: "700", textTransform: "capitalize" }}>"{word}"</span>
                  <span style={{ fontSize: "0.75rem", background: "rgba(244, 63, 94, 0.3)", padding: "2px 6px", borderRadius: "10px", color: "#fff" }}>
                    {count} times
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: "var(--accent-emerald)", fontSize: "0.9rem" }}>
              No recurring filler words recorded! Great fluency.
            </p>
          )}
        </div>
      </section>

      {/* Session History Table */}
      <section>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
          <h3 style={{ fontSize: "1.3rem" }}>Past Practice Sessions</h3>

          {/* Mode Filter Pills */}
          <div style={{ display: "flex", gap: "6px" }}>
            {["all", "gd", "hr", "resume"].map((m) => (
              <button
                key={m}
                onClick={() => setModeFilter(m)}
                style={{
                  padding: "6px 14px",
                  borderRadius: "var(--radius-full)",
                  fontSize: "0.8rem",
                  fontWeight: "600",
                  textTransform: "uppercase",
                  background: modeFilter === m ? "var(--gradient-primary)" : "rgba(255, 255, 255, 0.04)",
                  border: "1px solid var(--border-subtle)",
                  color: modeFilter === m ? "#fff" : "var(--text-secondary)",
                  cursor: "pointer",
                }}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {sessions.length === 0 ? (
          <div className="glass-panel" style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
            No sessions recorded yet. Start practicing in GD, HR, or Resume mode!
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {sessions.map((s) => (
              <div
                key={s.id}
                onClick={() => handleOpenDetail(s.id)}
                className="glass-panel"
                style={{
                  padding: "14px 16px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "12px",
                  transition: "all 0.2s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: "1 1 220px" }}>
                  <span
                    className={
                      s.mode === "gd"
                        ? "badge badge-indigo"
                        : s.mode === "hr"
                        ? "badge badge-cyan"
                        : "badge badge-emerald"
                    }
                  >
                    {s.mode.toUpperCase()}
                  </span>
                  <div>
                    <div style={{ fontWeight: "600", fontSize: "0.92rem", color: "var(--text-primary)" }}>
                      {s.title?.length > 70 ? s.title.slice(0, 70) + "..." : s.title}
                    </div>
                    <div style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>
                      {formatDate(s.timestamp)} • {Math.round(s.duration_seconds || 0)}s
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "14px", marginLeft: "auto" }}>
                  {/* Fillers Badge */}
                  <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                    Fillers: <strong style={{ color: s.filler_count > 4 ? "#fda4af" : "#6ee7b7" }}>{s.filler_count}</strong>
                  </span>

                  {/* Score */}
                  <div
                    style={{
                      fontFamily: "var(--font-heading)",
                      fontWeight: "800",
                      fontSize: "1.2rem",
                      color: s.overall_score >= 80 ? "#10b981" : s.overall_score >= 65 ? "#6366f1" : "#f59e0b",
                    }}
                  >
                    {s.overall_score}
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>/100</span>
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={(e) => handleDeleteSession(s.id, e)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                      padding: "4px",
                    }}
                    title="Delete session"
                  >
                    <Trash2 size={16} />
                  </button>

                  <ChevronRight size={18} color="var(--text-muted)" />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Selected Session Modal */}
      {selectedSession && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "rgba(0, 0, 0, 0.78)",
            backdropFilter: "blur(12px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "14px",
            overflowY: "auto",
          }}
          onClick={() => setSelectedSession(null)}
        >
          <div
            className="glass-panel"
            style={{
              maxWidth: "850px",
              width: "100%",
              maxHeight: "92vh",
              overflowY: "auto",
              padding: "clamp(20px, 4vw, 32px)",
              position: "relative",
              boxSizing: "border-box",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedSession(null)}
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                background: "rgba(255, 255, 255, 0.1)",
                border: "none",
                color: "#ffffff",
                borderRadius: "50%",
                width: "32px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <X size={16} />
            </button>

            <div style={{ marginBottom: "18px", paddingRight: "40px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", flexWrap: "wrap" }}>
                <span className="badge badge-indigo">{selectedSession.mode.toUpperCase()}</span>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  {formatDate(selectedSession.timestamp)}
                </span>
              </div>
              <h2 style={{ fontSize: "clamp(1.15rem, 3.5vw, 1.45rem)", lineHeight: "1.3" }}>
                "{selectedSession.title}"
              </h2>
            </div>

            <ScoreCard
              analysis={selectedSession}
              mode={selectedSession.mode}
            />
          </div>
        </div>
      )}
    </div>
  );
}
