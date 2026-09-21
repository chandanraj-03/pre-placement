import React, { useEffect, useState } from "react";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lightbulb,
  Sparkles,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  FileText,
  Activity,
  Award,
  Volume2
} from "lucide-react";
import confetti from "canvas-confetti";

export default function ScoreCard({ analysis, onTryAgain, mode = "general" }) {
  const [showTranscript, setShowTranscript] = useState(true); // Open by default
  const [showModelAnswer, setShowModelAnswer] = useState(true);

  const scores = analysis?.scores || {
    overall: 70,
    fluency: 70,
    grammar: 70,
    vocabulary: 70,
    relevance: 70,
    structure: 70,
  };

  const fillerData = analysis?.filler_words || { total_count: 0, breakdown: {} };
  const starData = analysis?.star_analysis;
  const feedback = analysis?.feedback || {};
  const duration = analysis?.duration_seconds || 0;
  const wpm = analysis?.speaking_rate_wpm || 0;

  useEffect(() => {
    if (scores.overall >= 80) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#6366f1", "#06b6d4", "#10b981", "#f59e0b"],
      });
    }
  }, [scores.overall]);

  const getScoreColor = (val) => {
    if (val >= 80) return "#10b981"; // Emerald
    if (val >= 65) return "#6366f1"; // Indigo
    if (val >= 50) return "#f59e0b"; // Amber
    return "#f43f5e"; // Rose
  };

  const formatDuration = (secs) => {
    const mins = Math.floor(secs / 60);
    const rem = Math.round(secs % 60);
    if (mins === 0) return `${rem} sec`;
    return `${mins} min ${rem} sec`;
  };

  // Highlights detected filler words inside the spoken transcript
  const renderHighlightedTranscript = (text) => {
    if (!text) return null;
    const fillers = Object.keys(fillerData.breakdown || {}).map((f) => f.toLowerCase());
    if (fillers.length === 0) return <span>"{text}"</span>;

    const tokens = text.split(/(\s+)/);
    return tokens.map((token, idx) => {
      const cleanToken = token.toLowerCase().replace(/[^a-z]/g, "");
      if (cleanToken && fillers.includes(cleanToken)) {
        return (
          <mark
            key={idx}
            style={{
              background: "rgba(244, 63, 94, 0.25)",
              color: "#fda4af",
              padding: "2px 5px",
              borderRadius: "4px",
              fontWeight: "600",
              border: "1px solid rgba(244, 63, 94, 0.4)",
            }}
            title="Filler word"
          >
            {token}
          </mark>
        );
      }
      return <span key={idx}>{token}</span>;
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header Banner with Overall Score & Summary */}
      <div
        className="glass-panel-glow"
        style={{
          padding: "28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "20px",
          background: "linear-gradient(135deg, rgba(18, 25, 43, 0.9) 0%, rgba(30, 41, 70, 0.8) 100%)",
        }}
      >
        <div style={{ maxWidth: "560px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
            <span className="badge badge-indigo">
              <Award size={13} /> AI Evaluation Report
            </span>
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
              Engine: {analysis.stt_provider === "groq_whisper" ? "Groq Whisper STT" : "Speech-to-Text"}
            </span>
          </div>
          <h2 style={{ fontSize: "1.7rem", marginBottom: "8px" }}>
            {scores.overall >= 80
              ? "Impressive Performance!"
              : scores.overall >= 65
              ? "Solid Attempt with Clear Upside"
              : "Needs More Polish & Practice"}
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: "1.6" }}>
            {feedback.summary || "Here is your detailed communication and content breakdown."}
          </p>
        </div>

        {/* Circular Overall Score Indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div
            style={{
              position: "relative",
              width: "110px",
              height: "110px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="110" height="110" viewBox="0 0 110 110">
              <circle
                cx="55"
                cy="55"
                r="46"
                fill="none"
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth="9"
              />
              <circle
                cx="55"
                cy="55"
                r="46"
                fill="none"
                stroke={getScoreColor(scores.overall)}
                strokeWidth="9"
                strokeDasharray={2 * Math.PI * 46}
                strokeDashoffset={2 * Math.PI * 46 * (1 - scores.overall / 100)}
                strokeLinecap="round"
                transform="rotate(-90 55 55)"
                style={{ transition: "stroke-dashoffset 1s ease" }}
              />
            </svg>
            <div style={{ position: "absolute", textAlign: "center" }}>
              <div style={{ fontFamily: "var(--font-heading)", fontSize: "2rem", fontWeight: "800", lineHeight: "1" }}>
                {scores.overall}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
                Overall
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Prominent "What You Spoke" (Speech-to-Text Transcript) Card */}
      {analysis.transcript && (
        <div
          className="glass-panel"
          style={{
            padding: "24px",
            borderLeft: "4px solid var(--accent-cyan)",
            background: "rgba(13, 19, 33, 0.8)",
          }}
        >
          <div
            onClick={() => setShowTranscript(!showTranscript)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
              userSelect: "none",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  background: "rgba(6, 182, 212, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--accent-cyan)",
                }}
              >
                <FileText size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: "1.1rem", color: "var(--text-primary)" }}>
                  What You Spoke (Speech-to-Text Transcript)
                </h3>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  {analysis.transcript.trim().split(/\s+/).length} Words recorded
                  {fillerData.total_count > 0 && ` • Highlighted ${fillerData.total_count} filler words`}
                </span>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span className="badge badge-cyan">Transcribed</span>
              {showTranscript ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </div>
          </div>

          {showTranscript && (
            <div
              style={{
                marginTop: "16px",
                padding: "18px",
                background: "rgba(0, 0, 0, 0.35)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-subtle)",
                fontSize: "1rem",
                color: "var(--text-primary)",
                lineHeight: "1.75",
                maxHeight: "260px",
                overflowY: "auto",
              }}
            >
              {renderHighlightedTranscript(analysis.transcript)}
            </div>
          )}
        </div>
      )}

      {/* Sub-Scores Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px" }}>
        {[
          { label: "Fluency", val: scores.fluency, desc: "Smoothness & Flow" },
          { label: "Grammar", val: scores.grammar, desc: "Syntax & Accuracy" },
          { label: "Vocabulary", val: scores.vocabulary, desc: "Word Choice & Range" },
          { label: "Relevance", val: scores.relevance, desc: "Answer Precision" },
          { label: "Structure", val: scores.structure, desc: "Logical Organization" },
        ].map((item, idx) => (
          <div
            key={idx}
            className="glass-panel"
            style={{
              padding: "18px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "600" }}>
                {item.label}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-heading)",
                  fontWeight: "700",
                  fontSize: "1.2rem",
                  color: getScoreColor(item.val),
                }}
              >
                {item.val}<span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>/100</span>
              </span>
            </div>
            {/* Progress bar */}
            <div style={{ height: "6px", width: "100%", background: "rgba(255, 255, 255, 0.08)", borderRadius: "3px", overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  width: `${item.val}%`,
                  background: getScoreColor(item.val),
                  borderRadius: "3px",
                  transition: "width 0.8s ease",
                }}
              />
            </div>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{item.desc}</span>
          </div>
        ))}
      </div>

      {/* Metrics Row: Duration, Speaking Pace, Filler Words */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px" }}>
        <div className="glass-panel" style={{ padding: "18px" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
            Speaking Duration
          </span>
          <div style={{ fontSize: "1.4rem", fontWeight: "700", marginTop: "4px", color: "var(--text-primary)" }}>
            {formatDuration(duration)}
          </div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            Ideal duration: 1 to 2.5 minutes
          </span>
        </div>

        <div className="glass-panel" style={{ padding: "18px" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
            Speaking Pace
          </span>
          <div style={{ fontSize: "1.4rem", fontWeight: "700", marginTop: "4px", color: wpm >= 120 && wpm <= 160 ? "var(--accent-emerald)" : "var(--accent-amber)" }}>
            {wpm > 0 ? `${wpm} WPM` : "Calculated"}
          </div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            Ideal pace: 130 - 160 words/min
          </span>
        </div>

        <div className="glass-panel" style={{ padding: "18px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
              Filler Words
            </span>
            <span
              className={fillerData.total_count > 5 ? "badge badge-rose" : fillerData.total_count > 2 ? "badge badge-amber" : "badge badge-emerald"}
            >
              {fillerData.total_count} Detected
            </span>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "10px" }}>
            {fillerData.breakdown && Object.keys(fillerData.breakdown).length > 0 ? (
              Object.entries(fillerData.breakdown).map(([word, count]) => (
                <span
                  key={word}
                  style={{
                    fontSize: "0.75rem",
                    padding: "3px 8px",
                    borderRadius: "var(--radius-sm)",
                    background: "rgba(244, 63, 94, 0.12)",
                    border: "1px solid rgba(244, 63, 94, 0.3)",
                    color: "#fda4af",
                  }}
                >
                  "{word}": <strong>{count}</strong>
                </span>
              ))
            ) : (
              <span style={{ fontSize: "0.85rem", color: "var(--accent-emerald)" }}>
                Zero filler words detected! Excellent!
              </span>
            )}
          </div>
        </div>
      </div>

      {/* STAR Framework Analysis (For HR questions or if applicable) */}
      {starData && starData.applicable && (
        <div className="glass-panel" style={{ padding: "22px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <span className="badge badge-cyan">Behavioral Analysis</span>
            <h3 style={{ fontSize: "1.1rem" }}>STAR Framework Check</h3>
          </div>

          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "16px" }}>
            {starData.assessment}
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px" }}>
            {[
              { key: "situation_present", label: "Situation", desc: "Context set" },
              { key: "task_present", label: "Task", desc: "Goal defined" },
              { key: "action_present", label: "Action", desc: "Your direct steps" },
              { key: "result_present", label: "Result", desc: "Metrics/outcome" },
            ].map((item) => {
              const isPresent = Boolean(starData[item.key]);
              return (
                <div
                  key={item.key}
                  style={{
                    padding: "12px",
                    borderRadius: "var(--radius-md)",
                    background: isPresent ? "rgba(16, 185, 129, 0.08)" : "rgba(244, 63, 94, 0.08)",
                    border: `1px solid ${isPresent ? "rgba(16, 185, 129, 0.25)" : "rgba(244, 63, 94, 0.25)"}`,
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  {isPresent ? (
                    <CheckCircle2 size={20} color="#10b981" />
                  ) : (
                    <XCircle size={20} color="#f43f5e" />
                  )}
                  <div>
                    <div style={{ fontWeight: "700", fontSize: "0.9rem", color: isPresent ? "#10b981" : "#fda4af" }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      {item.desc}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Strengths & Weaknesses Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "18px" }}>
        {/* Strengths */}
        <div className="glass-panel" style={{ padding: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px", color: "var(--accent-emerald)" }}>
            <CheckCircle2 size={20} />
            <h3 style={{ fontSize: "1.05rem", color: "var(--text-primary)" }}>What You Did Well</h3>
          </div>
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "10px" }}>
            {feedback.strengths && feedback.strengths.length > 0 ? (
              feedback.strengths.map((s, i) => (
                <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                  <span style={{ color: "var(--accent-emerald)", marginTop: "2px" }}>•</span>
                  <span>{s}</span>
                </li>
              ))
            ) : (
              <li style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>No specific strengths highlighted.</li>
            )}
          </ul>
        </div>

        {/* Weaknesses / Improvements */}
        <div className="glass-panel" style={{ padding: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px", color: "var(--accent-amber)" }}>
            <AlertTriangle size={20} />
            <h3 style={{ fontSize: "1.05rem", color: "var(--text-primary)" }}>Areas to Fix</h3>
          </div>
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "10px" }}>
            {feedback.weaknesses && feedback.weaknesses.length > 0 ? (
              feedback.weaknesses.map((w, i) => (
                <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                  <span style={{ color: "var(--accent-amber)", marginTop: "2px" }}>•</span>
                  <span>{w}</span>
                </li>
              ))
            ) : (
              <li style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>No critical issues found.</li>
            )}
          </ul>
        </div>
      </div>

      {/* Actionable Tips */}
      {feedback.actionable_tips && feedback.actionable_tips.length > 0 && (
        <div
          className="glass-panel"
          style={{
            padding: "20px",
            background: "rgba(99, 102, 241, 0.05)",
            border: "1px solid rgba(99, 102, 241, 0.25)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px", color: "var(--accent-primary)" }}>
            <Lightbulb size={20} />
            <h3 style={{ fontSize: "1.05rem", color: "var(--text-primary)" }}>Placement Coach's Actionable Tips</h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {feedback.actionable_tips.map((tip, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                  fontSize: "0.9rem",
                  color: "var(--text-secondary)",
                }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: "22px",
                    height: "22px",
                    borderRadius: "50%",
                    background: "rgba(99, 102, 241, 0.2)",
                    color: "var(--accent-primary)",
                    fontSize: "0.75rem",
                    fontWeight: "700",
                  }}
                >
                  {i + 1}
                </span>
                <span>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upgraded Model Answer */}
      {analysis.improved_answer_sample && (
        <div className="glass-panel" style={{ padding: "20px" }}>
          <div
            onClick={() => setShowModelAnswer(!showModelAnswer)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
              userSelect: "none",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--accent-cyan)" }}>
              <Sparkles size={20} />
              <h3 style={{ fontSize: "1.05rem", color: "var(--text-primary)" }}>
                Model Answer: How a Top Candidate Would Phrase This
              </h3>
            </div>
            {showModelAnswer ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>

          {showModelAnswer && (
            <div
              style={{
                marginTop: "14px",
                padding: "16px",
                background: "rgba(0, 0, 0, 0.3)",
                borderLeft: "3px solid var(--accent-cyan)",
                borderRadius: "var(--radius-sm)",
                fontSize: "0.95rem",
                color: "var(--text-primary)",
                lineHeight: "1.7",
              }}
            >
              {analysis.improved_answer_sample}
            </div>
          )}
        </div>
      )}

      {/* Action Footer */}
      {onTryAgain && (
        <div style={{ display: "flex", justifyContent: "center", marginTop: "10px" }}>
          <button
            onClick={onTryAgain}
            className="btn btn-primary"
            style={{ padding: "14px 36px", fontSize: "1.05rem", gap: "10px" }}
          >
            <RotateCcw size={18} />
            <span>Practice Again & Improve</span>
          </button>
        </div>
      )}
    </div>
  );
}
