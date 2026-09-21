import React, { useState, useEffect } from "react";
import {
  Briefcase,
  Sparkles,
  RefreshCw,
  HelpCircle,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  ArrowRight
} from "lucide-react";
import { api } from "../api/client";
import AudioRecorder from "../components/AudioRecorder";
import ScoreCard from "../components/ScoreCard";
import ModelAnswerCard from "../components/ModelAnswerCard";

export default function HRInterview({ onSessionSaved }) {
  const [category, setCategory] = useState("behavioral");
  const [questionData, setQuestionData] = useState(null);
  const [modelAnswer, setModelAnswer] = useState("");
  const [isGeneratingAnswer, setIsGeneratingAnswer] = useState(false);
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(false);
  const [activeView, setActiveView] = useState("ready"); // ready, results
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    handleGenerateQuestion("behavioral");
  }, []);

  const handleGenerateQuestion = async (cat = category) => {
    setIsLoadingQuestion(true);
    setErrorMsg("");
    try {
      const res = await api.generateHRQuestion(cat);
      if (res.success && res.data) {
        setQuestionData(res.data);
        setModelAnswer(res.data.model_spoken_answer || "");
        setActiveView("ready");
        setAnalysisResult(null);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to generate HR question. Verify backend connection.");
    } finally {
      setIsLoadingQuestion(false);
    }
  };

  const handleGenerateFreshAnswer = async () => {
    if (!questionData?.question) return;
    setIsGeneratingAnswer(true);
    try {
      const res = await api.generateHRAnswer(questionData.question, category);
      if (res.success && res.data?.sample_answer) {
        setModelAnswer(res.data.sample_answer);
      }
    } catch (err) {
      console.warn("Failed to generate fresh HR answer:", err);
    } finally {
      setIsGeneratingAnswer(false);
    }
  };

  const handleRecordingComplete = async ({ audioBlob, fallbackTranscript, durationSeconds }) => {
    setIsAnalyzing(true);
    setErrorMsg("");
    try {
      const res = await api.analyzeHRResponse({
        audioBlob,
        fallbackTranscript,
        question: questionData?.question || "HR Interview Question",
        category,
        durationSeconds,
      });

      if (res.success && res.analysis) {
        setAnalysisResult(res.analysis);
        setActiveView("results");
        if (onSessionSaved) onSessionSaved();
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Failed to analyze HR answer.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleTryAgain = () => {
    setActiveView("ready");
    setAnalysisResult(null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span className="badge badge-cyan">
              <Briefcase size={12} /> Mode 2
            </span>
            <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Behavioral & Personal Fit</span>
          </div>
          <h1 style={{ fontSize: "2rem" }}>HR Interview Simulator</h1>
        </div>

        {/* Category Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              handleGenerateQuestion(e.target.value);
            }}
            className="input-field"
            style={{ width: "auto", cursor: "pointer" }}
            disabled={isLoadingQuestion}
          >
            <option value="behavioral">🎯 Behavioral (STAR)</option>
            <option value="situational">⚡ Situational & Pressure</option>
            <option value="strengths_weaknesses">⚖️ Strengths & Weaknesses</option>
            <option value="team">🤝 Teamwork & Conflict</option>
            <option value="career_goals">🚀 Goals & Company Fit</option>
          </select>

          <button
            onClick={() => handleGenerateQuestion()}
            className="btn btn-primary"
            disabled={isLoadingQuestion}
            style={{ gap: "8px" }}
          >
            <RefreshCw size={16} className={isLoadingQuestion ? "spinner" : ""} />
            <span>{isLoadingQuestion ? "Drafting..." : "Next Question"}</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div
          style={{
            background: "rgba(244, 63, 94, 0.15)",
            border: "1px solid rgba(244, 63, 94, 0.4)",
            borderRadius: "var(--radius-md)",
            padding: "14px 18px",
            color: "#fda4af",
            fontSize: "0.95rem",
          }}
        >
          {errorMsg}
        </div>
      )}

      {/* HR Question Card */}
      {questionData && (
        <div
          className="glass-panel"
          style={{
            padding: "32px",
            borderLeft: "4px solid var(--accent-cyan)",
            display: "flex",
            flexDirection: "column",
            gap: "22px",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <span className="badge badge-cyan">{questionData.category}</span>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Target Length: 60 - 120 secs</span>
            </div>
            <h2 style={{ fontSize: "1.75rem", lineHeight: "1.3" }}>
              "{questionData.question}"
            </h2>
          </div>

          {/* Interviewer Intent */}
          {questionData.intent && (
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
                background: "rgba(6, 182, 212, 0.06)",
                border: "1px solid rgba(6, 182, 212, 0.2)",
                padding: "14px 18px",
                borderRadius: "var(--radius-md)",
                color: "var(--text-secondary)",
                fontSize: "0.92rem",
              }}
            >
              <HelpCircle size={18} color="var(--accent-cyan)" style={{ marginTop: "2px", flexShrink: 0 }} />
              <div>
                <strong style={{ color: "var(--accent-cyan)" }}>Why HR asks this: </strong>
                {questionData.intent}
              </div>
            </div>
          )}

          {/* STAR Framework Guidelines */}
          {questionData.star_framework_guide && (
            <div>
              <div style={{ fontSize: "0.85rem", fontWeight: "700", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "10px" }}>
                Recommended STAR Framework Structure
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
                {[
                  { key: "situation", label: "S - Situation", tip: questionData.star_framework_guide.situation },
                  { key: "task", label: "T - Task", tip: questionData.star_framework_guide.task },
                  { key: "action", label: "A - Action (Spend 60% time here)", tip: questionData.star_framework_guide.action },
                  { key: "result", label: "R - Result (Metrics/impact)", tip: questionData.star_framework_guide.result },
                ].map((s) => (
                  <div
                    key={s.key}
                    style={{
                      padding: "14px",
                      background: "rgba(255, 255, 255, 0.03)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "var(--radius-md)",
                    }}
                  >
                    <div style={{ fontWeight: "700", color: "var(--accent-cyan)", fontSize: "0.9rem", marginBottom: "4px" }}>
                      {s.label}
                    </div>
                    <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                      {s.tip}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pro-Tips & Pitfalls Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
            {questionData.pro_tips && questionData.pro_tips.length > 0 && (
              <div
                style={{
                  padding: "14px 18px",
                  borderRadius: "var(--radius-md)",
                  background: "rgba(16, 185, 129, 0.04)",
                  border: "1px solid rgba(16, 185, 129, 0.2)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--accent-emerald)", fontWeight: "700", fontSize: "0.9rem", marginBottom: "8px" }}>
                  <Lightbulb size={16} />
                  <span>Pro Tips</span>
                </div>
                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "6px" }}>
                  {questionData.pro_tips.map((tip, i) => (
                    <li key={i} style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                      • {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {questionData.pitfalls_to_avoid && questionData.pitfalls_to_avoid.length > 0 && (
              <div
                style={{
                  padding: "14px 18px",
                  borderRadius: "var(--radius-md)",
                  background: "rgba(244, 63, 94, 0.04)",
                  border: "1px solid rgba(244, 63, 94, 0.2)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#fda4af", fontWeight: "700", fontSize: "0.9rem", marginBottom: "8px" }}>
                  <AlertTriangle size={16} />
                  <span>Pitfalls to Avoid</span>
                </div>
                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "6px" }}>
                  {questionData.pitfalls_to_avoid.map((pitfall, i) => (
                    <li key={i} style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                      • {pitfall}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Ready-to-Speak STAR Model Answer for Confidence Practice */}
      {questionData && activeView !== "results" && (
        <ModelAnswerCard
          answerText={modelAnswer}
          onGenerateAnswer={handleGenerateFreshAnswer}
          isGenerating={isGeneratingAnswer}
          mode="HR"
          tips={[
            "Notice how the situation is kept brief, while action and results take the spotlight",
            "Listen to the speech audio to catch how pauses emphasize achievements",
            "Read aloud once to banish hesitation before hitting record below"
          ]}
        />
      )}

      {/* Voice Recorder & Answer Analysis */}
      <section>
        <div style={{ marginBottom: "14px" }}>
          <h3 style={{ fontSize: "1.3rem", marginBottom: "4px" }}>
            {activeView === "results" ? "Your HR Evaluation" : "Speak Your Answer"}
          </h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            {activeView === "results"
              ? "See how well you structured your response and matched the STAR guidelines."
              : "Press start and answer naturally, as if sitting across from the interviewer."}
          </p>
        </div>

        {activeView !== "results" && (
          <AudioRecorder
            onRecordingComplete={handleRecordingComplete}
            isAnalyzing={isAnalyzing}
            prepTimeSeconds={3}
            maxDurationSeconds={180}
          />
        )}

        {activeView === "results" && analysisResult && (
          <ScoreCard
            analysis={analysisResult}
            onTryAgain={handleTryAgain}
            mode="hr"
          />
        )}
      </section>
    </div>
  );
}
