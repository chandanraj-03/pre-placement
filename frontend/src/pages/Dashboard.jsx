import React from "react";
import {
  Users,
  Briefcase,
  FileCode2,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Clock,
  ShieldCheck,
  Zap,
  Target
} from "lucide-react";

export default function Dashboard({ onNavigate, analytics, configStatus }) {
  const isConfigured = configStatus?.is_configured;
  const totalSessions = analytics?.total_sessions || 0;
  const avgScore = analytics?.overall_average || 0;
  const improvement = analytics?.improvement_delta || 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
      {/* Hero Section */}
      <section
        className="glass-panel-glow"
        style={{
          padding: "44px 36px",
          position: "relative",
          overflow: "hidden",
          background: "linear-gradient(135deg, rgba(18, 25, 43, 0.8) 0%, rgba(30, 41, 75, 0.7) 100%)",
        }}
      >
        <div style={{ maxWidth: "720px", position: "relative", zIndex: 2 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <span className="badge badge-indigo">
              <Sparkles size={12} /> Campus Placement Prep Coach
            </span>
            {isConfigured ? (
              <span className="badge badge-emerald">AI Inference Live</span>
            ) : (
              <span className="badge badge-amber">Offline / Setup Required</span>
            )}
          </div>

          <h1 style={{ fontSize: "2.8rem", lineHeight: "1.15", marginBottom: "16px", letterSpacing: "-0.03em" }}>
            Ace Your <span style={{ color: "var(--accent-primary)" }}>Group Discussions</span> &{" "}
            <span style={{ color: "var(--accent-cyan)" }}>Interviews</span> with AI
          </h1>

          <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem", lineHeight: "1.6", marginBottom: "28px" }}>
            Practice speaking naturally through your microphone. Get instant evaluation on fluency, grammar, filler words, answer structure, and STAR behavioral techniques.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "14px" }}>
            <button
              onClick={() => onNavigate("gd")}
              className="btn btn-primary"
              style={{ padding: "14px 28px", fontSize: "1rem" }}
            >
              <Users size={18} />
              <span>Start GD Practice</span>
              <ArrowRight size={16} />
            </button>

            <button
              onClick={() => onNavigate("hr")}
              className="btn btn-secondary"
              style={{ padding: "14px 28px", fontSize: "1rem" }}
            >
              <Briefcase size={18} />
              <span>HR Simulator</span>
            </button>

            <button
              onClick={() => onNavigate("resume")}
              className="btn btn-secondary"
              style={{ padding: "14px 28px", fontSize: "1rem" }}
            >
              <FileCode2 size={18} />
              <span>Resume Interview</span>
            </button>
          </div>
        </div>

        {/* Decorative background glow circle */}
        <div
          style={{
            position: "absolute",
            top: "-100px",
            right: "-100px",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
      </section>

      {/* Quick Stats Banner */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "18px" }}>
        <div className="glass-panel" style={{ padding: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", color: "var(--text-muted)", marginBottom: "8px" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: "600", textTransform: "uppercase" }}>Sessions Done</span>
            <Target size={18} color="var(--accent-primary)" />
          </div>
          <div style={{ fontSize: "2rem", fontWeight: "800" }}>{totalSessions}</div>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Across GD, HR & Resume rounds</span>
        </div>

        <div className="glass-panel" style={{ padding: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", color: "var(--text-muted)", marginBottom: "8px" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: "600", textTransform: "uppercase" }}>Average Score</span>
            <ShieldCheck size={18} color="var(--accent-emerald)" />
          </div>
          <div style={{ fontSize: "2rem", fontWeight: "800", color: avgScore >= 75 ? "var(--accent-emerald)" : avgScore >= 60 ? "var(--accent-primary)" : "var(--text-primary)" }}>
            {avgScore > 0 ? `${avgScore}/100` : "No sessions yet"}
          </div>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Target: 80+ for top placements</span>
        </div>

        <div className="glass-panel" style={{ padding: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", color: "var(--text-muted)", marginBottom: "8px" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: "600", textTransform: "uppercase" }}>Improvement Delta</span>
            <TrendingUp size={18} color="var(--accent-cyan)" />
          </div>
          <div style={{ fontSize: "2rem", fontWeight: "800", color: improvement >= 0 ? "var(--accent-cyan)" : "var(--accent-rose)" }}>
            {improvement > 0 ? `+${improvement} pts` : improvement < 0 ? `${improvement} pts` : "Baseline"}
          </div>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Comparing recent vs first attempts</span>
        </div>

        <div className="glass-panel" style={{ padding: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", color: "var(--text-muted)", marginBottom: "8px" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: "600", textTransform: "uppercase" }}>Speech Engine</span>
            <Zap size={18} color="var(--accent-amber)" />
          </div>
          <div style={{ fontSize: "1.2rem", fontWeight: "700", marginTop: "6px" }}>Dual STT</div>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Groq Whisper + Web Speech fallback</span>
        </div>
      </section>

      {/* 3 Main Preparation Modes */}
      <section>
        <div style={{ marginBottom: "20px" }}>
          <h2 style={{ fontSize: "1.6rem", marginBottom: "6px" }}>Preparation Modes</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
            Choose a mode based on your upcoming placement schedule
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" }}>
          {/* Card 1: GD Practice */}
          <div
            onClick={() => onNavigate("gd")}
            className="glass-panel"
            style={{
              padding: "30px",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              borderTop: "3px solid var(--accent-primary)",
              minHeight: "260px",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "12px",
                    background: "rgba(99, 102, 241, 0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--accent-primary)",
                  }}
                >
                  <Users size={24} />
                </div>
                <span className="badge badge-indigo">Mode 1</span>
              </div>

              <h3 style={{ fontSize: "1.3rem", marginBottom: "10px" }}>Group Discussion (GD)</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.92rem", lineHeight: "1.6" }}>
                Generate trending topics, study arguments for & against, review power vocabulary, and record your 2-minute speech with real-time feedback.
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--accent-primary)", fontWeight: "600", fontSize: "0.95rem", marginTop: "20px" }}>
              <span>Start GD Round</span>
              <ArrowRight size={16} />
            </div>
          </div>

          {/* Card 2: HR Simulator */}
          <div
            onClick={() => onNavigate("hr")}
            className="glass-panel"
            style={{
              padding: "30px",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              borderTop: "3px solid var(--accent-cyan)",
              minHeight: "260px",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "12px",
                    background: "rgba(6, 182, 212, 0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--accent-cyan)",
                  }}
                >
                  <Briefcase size={24} />
                </div>
                <span className="badge badge-cyan">Mode 2</span>
              </div>

              <h3 style={{ fontSize: "1.3rem", marginBottom: "10px" }}>HR Interview Simulator</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.92rem", lineHeight: "1.6" }}>
                Practice answering behavioral, situational, and cultural fit questions. The AI verifies whether you apply the STAR (Situation, Task, Action, Result) methodology.
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--accent-cyan)", fontWeight: "600", fontSize: "0.95rem", marginTop: "20px" }}>
              <span>Launch HR Interview</span>
              <ArrowRight size={16} />
            </div>
          </div>

          {/* Card 3: Resume Round */}
          <div
            onClick={() => onNavigate("resume")}
            className="glass-panel"
            style={{
              padding: "30px",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              borderTop: "3px solid var(--accent-emerald)",
              minHeight: "260px",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "12px",
                    background: "rgba(16, 185, 129, 0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--accent-emerald)",
                  }}
                >
                  <FileCode2 size={24} />
                </div>
                <span className="badge badge-emerald">Mode 3</span>
              </div>

              <h3 style={{ fontSize: "1.3rem", marginBottom: "10px" }}>Resume-Based Technical</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.92rem", lineHeight: "1.6" }}>
                Upload your resume PDF. The AI extracts your projects, skills, and internships, generating tough architectural questions interviewers will ask.
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--accent-emerald)", fontWeight: "600", fontSize: "0.95rem", marginTop: "20px" }}>
              <span>Upload & Practice</span>
              <ArrowRight size={16} />
            </div>
          </div>
        </div>
      </section>

      {/* Core Learning Cycle Banner */}
      <section
        className="glass-panel"
        style={{
          padding: "30px",
          background: "rgba(13, 19, 33, 0.6)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <span className="badge badge-indigo" style={{ marginBottom: "8px" }}>The Proven Loop</span>
          <h3 style={{ fontSize: "1.4rem" }}>Placement Readiness Cycle</h3>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: "14px",
          }}
        >
          {["1. Select Topic", "2. Speak via Mic", "3. Speech-to-Text", "4. AI Scoring & STAR", "5. Read Model Answer", "6. Try Again & Improve"].map(
            (step, idx) => (
              <React.Fragment key={idx}>
                <div
                  style={{
                    padding: "10px 18px",
                    borderRadius: "var(--radius-md)",
                    background: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid var(--border-subtle)",
                    fontSize: "0.88rem",
                    fontWeight: "600",
                    color: "var(--text-primary)",
                  }}
                >
                  {step}
                </div>
                {idx < 5 && <ArrowRight size={16} color="var(--accent-primary)" />}
              </React.Fragment>
            )
          )}
        </div>
      </section>
    </div>
  );
}
