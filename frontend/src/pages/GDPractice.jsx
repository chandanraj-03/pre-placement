import React, { useState, useEffect } from "react";
import {
  Users,
  Sparkles,
  RefreshCw,
  BookOpen,
  ThumbsUp,
  ThumbsDown,
  Compass,
  Volume2,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  MessageSquare
} from "lucide-react";
import { api } from "../api/client";
import AudioRecorder from "../components/AudioRecorder";
import ScoreCard from "../components/ScoreCard";
import ModelAnswerCard from "../components/ModelAnswerCard";

export default function GDPractice({ onSessionSaved }) {
  const [category, setCategory] = useState("trending");
  const [customPrompt, setCustomPrompt] = useState("");
  const [topicData, setTopicData] = useState(null);
  const [isLoadingTopic, setIsLoadingTopic] = useState(false);
  const [modelAnswer, setModelAnswer] = useState("");
  const [isGeneratingAnswer, setIsGeneratingAnswer] = useState(false);
  const [activeView, setActiveView] = useState("setup"); // setup, ready, results
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [activeTab, setActiveTab] = useState("arguments"); // arguments, vocab, framing

  // Generate initial topic on mount
  useEffect(() => {
    handleGenerateTopic("trending");
  }, []);

  const handleGenerateTopic = async (cat = category) => {
    setIsLoadingTopic(true);
    setErrorMsg("");
    try {
      const res = await api.generateGDTopic(cat, customPrompt);
      if (res.success && res.data) {
        setTopicData(res.data);
        setModelAnswer(res.data.model_spoken_speech || "");
        setActiveView("ready");
        setAnalysisResult(null);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to generate topic. Check backend connection.");
    } finally {
      setIsLoadingTopic(false);
    }
  };

  const handleGenerateFreshAnswer = async () => {
    if (!topicData?.topic) return;
    setIsGeneratingAnswer(true);
    try {
      const res = await api.generateGDAnswer(topicData.topic);
      if (res.success && res.data?.sample_answer) {
        setModelAnswer(res.data.sample_answer);
      }
    } catch (err) {
      console.warn("Failed to generate fresh answer:", err);
    } finally {
      setIsGeneratingAnswer(false);
    }
  };

  const handleRecordingComplete = async ({ audioBlob, fallbackTranscript, durationSeconds }) => {
    setIsAnalyzing(true);
    setErrorMsg("");
    try {
      const res = await api.analyzeGDResponse({
        audioBlob,
        fallbackTranscript,
        topic: topicData?.topic || "General Discussion",
        durationSeconds,
      });

      if (res.success && res.analysis) {
        setAnalysisResult(res.analysis);
        setActiveView("results");
        if (onSessionSaved) onSessionSaved();
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Failed to analyze speech. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleTryAgain = () => {
    setActiveView("ready");
    setAnalysisResult(null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "14px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span className="badge badge-indigo">
              <Users size={12} /> Mode 1
            </span>
            <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Round 1 of Placements</span>
          </div>
          <h1 style={{ fontSize: "clamp(1.5rem, 4vw, 2rem)" }}>Group Discussion Practice</h1>
        </div>

        {/* Category Selector */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", width: "auto" }}>
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              handleGenerateTopic(e.target.value);
            }}
            className="input-field"
            style={{ width: "auto", cursor: "pointer", flex: "1 1 180px", minHeight: "42px" }}
            disabled={isLoadingTopic}
          >
            <option value="trending">🔥 Trending Placements</option>
            <option value="technology">💻 Tech & AI</option>
            <option value="economy">📈 Business & Economy</option>
            <option value="social">🌍 Social Issues</option>
            <option value="campus">🎓 Campus & Student Life</option>
          </select>

          <button
            onClick={() => handleGenerateTopic()}
            className="btn btn-primary"
            disabled={isLoadingTopic}
            style={{ gap: "8px", flex: "1 1 130px", minHeight: "42px" }}
          >
            <RefreshCw size={16} className={isLoadingTopic ? "spinner" : ""} />
            <span>{isLoadingTopic ? "Generating..." : "New Topic"}</span>
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

      {/* Main Topic Card */}
      {topicData && (
        <div
          className="glass-panel"
          style={{
            padding: "clamp(18px, 4vw, 30px)",
            borderLeft: "4px solid var(--accent-primary)",
            display: "flex",
            flexDirection: "column",
            gap: "18px",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px", flexWrap: "wrap" }}>
              <span className="badge badge-indigo">{topicData.category}</span>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Target Duration: 1.5 - 2 mins</span>
            </div>
            <h2 style={{ fontSize: "clamp(1.25rem, 4vw, 1.7rem)", lineHeight: "1.3", color: "var(--text-primary)" }}>
              "{topicData.topic}"
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", marginTop: "8px", lineHeight: "1.6" }}>
              {topicData.explanation}
            </p>
          </div>

          {/* Subtabs for Topic Study Material - Scrollable on mobile */}
          <div
            style={{
              display: "flex",
              borderBottom: "1px solid var(--border-subtle)",
              gap: "8px",
              marginTop: "4px",
              overflowX: "auto",
              WebkitOverflowScrolling: "touch",
              paddingBottom: "2px",
            }}
          >
            {[
              { id: "arguments", label: "Key Arguments (Pros & Cons)", icon: ThumbsUp },
              { id: "vocab", label: "Power Vocabulary", icon: BookOpen },
              { id: "framing", label: "Opening & Conclusion Hooks", icon: Compass },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 14px",
                    background: "none",
                    border: "none",
                    borderBottom: isActive ? "2px solid var(--accent-primary)" : "2px solid transparent",
                    color: isActive ? "var(--text-primary)" : "var(--text-muted)",
                    fontWeight: isActive ? "600" : "500",
                    fontSize: "0.88rem",
                    cursor: "pointer",
                    outline: "none",
                    whiteSpace: "nowrap",
                    transition: "all 0.2s ease",
                    flexShrink: 0,
                  }}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab 1: Arguments */}
          {activeTab === "arguments" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: "14px" }}>
              {/* For */}
              <div
                style={{
                  padding: "16px",
                  borderRadius: "var(--radius-md)",
                  background: "rgba(16, 185, 129, 0.05)",
                  border: "1px solid rgba(16, 185, 129, 0.2)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--accent-emerald)", marginBottom: "10px", fontWeight: "700" }}>
                  <ThumbsUp size={16} />
                  <span>Arguments Supporting (FOR)</span>
                </div>
                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "8px" }}>
                  {topicData.arguments_for?.map((arg, i) => (
                    <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "0.88rem", color: "var(--text-secondary)" }}>
                      <span style={{ color: "var(--accent-emerald)", fontWeight: "700" }}>+</span>
                      <span>{arg}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Against */}
              <div
                style={{
                  padding: "16px",
                  borderRadius: "var(--radius-md)",
                  background: "rgba(244, 63, 94, 0.05)",
                  border: "1px solid rgba(244, 63, 94, 0.2)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#fda4af", marginBottom: "10px", fontWeight: "700" }}>
                  <ThumbsDown size={16} />
                  <span>Counterpoints (AGAINST)</span>
                </div>
                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "8px" }}>
                  {topicData.arguments_against?.map((arg, i) => (
                    <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "0.88rem", color: "var(--text-secondary)" }}>
                      <span style={{ color: "#fda4af", fontWeight: "700" }}>−</span>
                      <span>{arg}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Tab 2: Power Vocabulary */}
          {activeTab === "vocab" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 150px), 1fr))", gap: "10px" }}>
              {topicData.power_vocabulary?.map((v, i) => (
                <div
                  key={i}
                  style={{
                    padding: "12px",
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-md)",
                  }}
                >
                  <div style={{ fontWeight: "700", color: "var(--accent-cyan)", fontSize: "0.9rem" }}>
                    {v.word}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                    {v.meaning}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab 3: Framing Hooks */}
          {activeTab === "framing" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: "14px" }}>
              <div
                style={{
                  padding: "16px",
                  borderRadius: "var(--radius-md)",
                  background: "rgba(99, 102, 241, 0.05)",
                  border: "1px solid rgba(99, 102, 241, 0.2)",
                }}
              >
                <div style={{ fontWeight: "700", color: "var(--accent-primary)", marginBottom: "8px", fontSize: "0.92rem" }}>
                  🏁 High-Impact Opening Statements
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {topicData.opening_points?.map((pt, i) => (
                    <p key={i} style={{ fontSize: "0.86rem", color: "var(--text-secondary)", fontStyle: "italic" }}>
                      "{pt}"
                    </p>
                  ))}
                </div>
              </div>

              <div
                style={{
                  padding: "16px",
                  borderRadius: "var(--radius-md)",
                  background: "rgba(6, 182, 212, 0.05)",
                  border: "1px solid rgba(6, 182, 212, 0.2)",
                }}
              >
                <div style={{ fontWeight: "700", color: "var(--accent-cyan)", marginBottom: "8px", fontSize: "0.92rem" }}>
                  🎯 Strong Concluding Syntheses
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {topicData.closing_points?.map((pt, i) => (
                    <p key={i} style={{ fontSize: "0.86rem", color: "var(--text-secondary)", fontStyle: "italic" }}>
                      "{pt}"
                    </p>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Ready-to-Speak Model Answer for Confidence Practice */}
      {topicData && activeView !== "results" && (
        <ModelAnswerCard
          answerText={modelAnswer}
          onGenerateAnswer={handleGenerateFreshAnswer}
          isGenerating={isGeneratingAnswer}
          mode="GD"
          tips={[
            "Practice reading this aloud twice to build verbal momentum",
            "Listen to the pronunciation and notice the natural pauses",
            "When you're ready, hit 'Start Speaking' below and deliver in your own words"
          ]}
        />
      )}

      {/* Voice Recording Section */}
      <section>
        <div style={{ marginBottom: "14px" }}>
          <h3 style={{ fontSize: "1.3rem", marginBottom: "4px" }}>
            {activeView === "results" ? "Your Speech Analysis" : "Deliver Your Response"}
          </h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            {activeView === "results"
              ? "Review your score and areas of improvement below."
              : "Hit record and speak for 1 to 2 minutes as if you were in the actual group discussion."}
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

        {/* Results view */}
        {activeView === "results" && analysisResult && (
          <ScoreCard
            analysis={analysisResult}
            onTryAgain={handleTryAgain}
            mode="gd"
          />
        )}
      </section>
    </div>
  );
}
