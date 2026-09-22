import React from "react";
import {
  Users,
  Briefcase,
  FileCode2,
  BookOpen,
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
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Hero Section */}
      <section
        className="glass-panel-glow"
        style={{
          padding: "clamp(24px, 5vw, 44px) clamp(16px, 4vw, 36px)",
          position: "relative",
          overflow: "hidden",
          background: "linear-gradient(135deg, rgba(18, 25, 43, 0.8) 0%, rgba(30, 41, 75, 0.7) 100%)",
        }}
      >
        <div style={{ maxWidth: "720px", position: "relative", zIndex: 2 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px", flexWrap: "wrap" }}>
            <span className="badge badge-indigo">
              <Sparkles size={12} /> Campus Placement Prep Coach
            </span>
            {isConfigured ? (
              <span className="badge badge-emerald">AI Inference Live</span>
            ) : (
              <span className="badge badge-amber">Offline / Setup Required</span>
            )}
          </div>

          <h1 style={{ fontSize: "clamp(1.75rem, 5vw, 2.75rem)", lineHeight: "1.2", marginBottom: "14px", letterSpacing: "-0.03em" }}>
            Ace Your <span style={{ color: "var(--accent-primary)" }}>Group Discussions</span> &{" "}
            <span style={{ color: "var(--accent-cyan)" }}>Interviews</span> with AI
          </h1>

          <p style={{ color: "var(--text-secondary)", fontSize: "clamp(0.92rem, 2.2vw, 1.08rem)", lineHeight: "1.6", marginBottom: "24px" }}>
            Practice speaking naturally through your microphone. Get instant evaluation on fluency, grammar, filler words, answer structure, and STAR behavioral techniques.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
            <button
              onClick={() => onNavigate("gd")}
              className="btn btn-primary"
              style={{ padding: "12px 22px", fontSize: "0.95rem", flex: "1 1 200px" }}
            >
              <Users size={18} />
              <span>Start GD Practice</span>
              <ArrowRight size={16} />
            </button>

            <button
              onClick={() => onNavigate("hr")}
              className="btn btn-secondary"
              style={{ padding: "12px 22px", fontSize: "0.95rem", flex: "1 1 150px" }}
            >
              <Briefcase size={18} />
              <span>HR Simulator</span>
            </button>

            <button
              onClick={() => onNavigate("resume")}
              className="btn btn-secondary"
              style={{ padding: "12px 22px", fontSize: "0.95rem", flex: "1 1 160px" }}
            >
              <FileCode2 size={18} />
              <span>Resume Interview</span>
            </button>

            <button
              onClick={() => onNavigate("notes")}
              className="btn btn-secondary"
              style={{ padding: "12px 22px", fontSize: "0.95rem", flex: "1 1 160px" }}
            >
              <BookOpen size={18} />
              <span>Study Notes & PDFs</span>
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
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(clamp(140px, 45vw, 220px), 1fr))", gap: "14px" }}>
        <div className="glass-panel" style={{ padding: "18px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", color: "var(--text-muted)", marginBottom: "6px" }}>
            <span style={{ fontSize: "0.78rem", fontWeight: "600", textTransform: "uppercase" }}>Sessions Done</span>
            <Target size={16} color="var(--accent-primary)" />
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: "800" }}>{totalSessions}</div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Across GD, HR & Resume</span>
        </div>

        <div className="glass-panel" style={{ padding: "18px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", color: "var(--text-muted)", marginBottom: "6px" }}>
            <span style={{ fontSize: "0.78rem", fontWeight: "600", textTransform: "uppercase" }}>Average Score</span>
            <ShieldCheck size={16} color="var(--accent-emerald)" />
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: "800", color: avgScore >= 75 ? "var(--accent-emerald)" : avgScore >= 60 ? "var(--accent-primary)" : "var(--text-primary)" }}>
            {avgScore > 0 ? `${avgScore}/100` : "None yet"}
          </div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Target: 80+ score</span>
        </div>

        <div className="glass-panel" style={{ padding: "18px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", color: "var(--text-muted)", marginBottom: "6px" }}>
            <span style={{ fontSize: "0.78rem", fontWeight: "600", textTransform: "uppercase" }}>Improvement Delta</span>
            <TrendingUp size={16} color="var(--accent-cyan)" />
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: "800", color: improvement >= 0 ? "var(--accent-cyan)" : "var(--accent-rose)" }}>
            {improvement > 0 ? `+${improvement} pts` : improvement < 0 ? `${improvement} pts` : "Baseline"}
          </div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>vs first attempts</span>
        </div>

        <div className="glass-panel" style={{ padding: "18px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", color: "var(--text-muted)", marginBottom: "6px" }}>
            <span style={{ fontSize: "0.78rem", fontWeight: "600", textTransform: "uppercase" }}>Speech Engine</span>
            <Zap size={16} color="var(--accent-amber)" />
          </div>
          <div style={{ fontSize: "1.1rem", fontWeight: "700", marginTop: "4px" }}>Dual STT</div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Groq Whisper + Web Speech</span>
        </div>
      </section>

      {/* 3 Main Preparation Modes */}
      <section>
        <div style={{ marginBottom: "16px" }}>
          <h2 style={{ fontSize: "1.45rem", marginBottom: "4px" }}>Preparation Modes</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            Choose a mode based on your upcoming placement schedule
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: "16px" }}>
          {/* Card 1: GD Practice */}
          <div
            onClick={() => onNavigate("gd")}
            className="glass-panel"
            style={{
              padding: "24px 20px",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              borderTop: "3px solid var(--accent-primary)",
              minHeight: "230px",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "10px",
                    background: "rgba(99, 102, 241, 0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--accent-primary)",
                  }}
                >
                  <Users size={22} />
                </div>
                <span className="badge badge-indigo">Mode 1</span>
              </div>

              <h3 style={{ fontSize: "1.2rem", marginBottom: "8px" }}>Group Discussion (GD)</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", lineHeight: "1.6" }}>
                Generate trending topics, study arguments for & against, review power vocabulary, and record your 2-minute speech with real-time feedback.
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--accent-primary)", fontWeight: "600", fontSize: "0.9rem", marginTop: "16px" }}>
              <span>Start GD Round</span>
              <ArrowRight size={15} />
            </div>
          </div>

          {/* Card 2: HR Simulator */}
          <div
            onClick={() => onNavigate("hr")}
            className="glass-panel"
            style={{
              padding: "24px 20px",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              borderTop: "3px solid var(--accent-cyan)",
              minHeight: "230px",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "10px",
                    background: "rgba(6, 182, 212, 0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--accent-cyan)",
                  }}
                >
                  <Briefcase size={22} />
                </div>
                <span className="badge badge-cyan">Mode 2</span>
              </div>

              <h3 style={{ fontSize: "1.2rem", marginBottom: "8px" }}>HR Interview Simulator</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", lineHeight: "1.6" }}>
                Practice answering behavioral, situational, and cultural fit questions. The AI verifies whether you apply the STAR (Situation, Task, Action, Result) methodology.
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--accent-cyan)", fontWeight: "600", fontSize: "0.9rem", marginTop: "16px" }}>
              <span>Launch HR Interview</span>
              <ArrowRight size={15} />
            </div>
          </div>

          {/* Card 3: Resume Round */}
          <div
            onClick={() => onNavigate("resume")}
            className="glass-panel"
            style={{
              padding: "24px 20px",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              borderTop: "3px solid var(--accent-emerald)",
              minHeight: "230px",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "10px",
                    background: "rgba(16, 185, 129, 0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--accent-emerald)",
                  }}
                >
                  <FileCode2 size={22} />
                </div>
                <span className="badge badge-emerald">Mode 3</span>
              </div>

              <h3 style={{ fontSize: "1.2rem", marginBottom: "8px" }}>Resume-Based Technical</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", lineHeight: "1.6" }}>
                Upload your resume PDF. The AI extracts your projects, skills, and internships, generating tough architectural questions interviewers will ask.
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--accent-emerald)", fontWeight: "600", fontSize: "0.9rem", marginTop: "16px" }}>
              <span>Upload & Practice</span>
              <ArrowRight size={15} />
            </div>
          </div>

          {/* Card 4: Study Notes & Cheat Sheets */}
          <div
            onClick={() => onNavigate("notes")}
            className="glass-panel"
            style={{
              padding: "24px 20px",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              borderTop: "3px solid #818cf8",
              minHeight: "230px",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "10px",
                    background: "rgba(129, 140, 248, 0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#818cf8",
                  }}
                >
                  <BookOpen size={22} />
                </div>
                <span className="badge badge-indigo">Resource</span>
              </div>

              <h3 style={{ fontSize: "1.2rem", marginBottom: "8px" }}>Notes & Cheat Sheets</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", lineHeight: "1.6" }}>
                Save and organize your study materials with Google Drive links. Preview PDFs directly in the app, search concepts, and organize by folders.
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#818cf8", fontWeight: "600", fontSize: "0.9rem", marginTop: "16px" }}>
              <span>Open Study Notes</span>
              <ArrowRight size={15} />
            </div>
          </div>
        </div>
      </section>

      {/* Core Learning Cycle Banner */}
      <section
        className="glass-panel"
        style={{
          padding: "24px 18px",
          background: "rgba(13, 19, 33, 0.6)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "18px" }}>
          <span className="badge badge-indigo" style={{ marginBottom: "6px" }}>The Proven Loop</span>
          <h3 style={{ fontSize: "1.25rem" }}>Placement Readiness Cycle</h3>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 150px), 1fr))",
            gap: "10px",
          }}
        >
          {["1. Select Topic", "2. Speak via Mic", "3. Speech-to-Text", "4. AI Scoring & STAR", "5. Read Model Answer", "6. Try Again & Improve"].map(
            (step, idx) => (
              <div
                key={idx}
                style={{
                  padding: "10px 14px",
                  borderRadius: "var(--radius-md)",
                  background: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid var(--border-subtle)",
                  fontSize: "0.84rem",
                  fontWeight: "600",
                  color: "var(--text-primary)",
                  textAlign: "center",
                }}
              >
                {step}
              </div>
            )
          )}
        </div>
      </section>
    </div>
  );
}
