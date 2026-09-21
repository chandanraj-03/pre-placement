import React, { useState, useEffect, useRef } from "react";
import {
  FileCode2,
  Upload,
  Sparkles,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Play,
  RotateCcw,
  Tag,
  FolderGit2,
  Briefcase,
  Layers,
  ChevronRight
} from "lucide-react";
import { api } from "../api/client";
import AudioRecorder from "../components/AudioRecorder";
import ScoreCard from "../components/ScoreCard";
import ModelAnswerCard from "../components/ModelAnswerCard";

export default function ResumeInterview({ onSessionSaved }) {
  const [resumeData, setResumeData] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [modelAnswer, setModelAnswer] = useState("");
  const [isGeneratingAnswer, setIsGeneratingAnswer] = useState(false);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [activeView, setActiveView] = useState("overview"); // overview, practice, results
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef(null);

  // Check if a resume was previously uploaded and stored
  useEffect(() => {
    checkCurrentResume();
  }, []);

  const checkCurrentResume = async () => {
    try {
      const res = await api.getCurrentResume();
      if (res.has_resume && res.resume) {
        setResumeData(res.resume);
        fetchQuestions();
      }
    } catch (e) {
      console.warn("Could not fetch cached resume:", e);
    }
  };

  const handleFileUpload = async (file) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setErrorMsg("Please upload a valid PDF document.");
      return;
    }

    setIsUploading(true);
    setErrorMsg("");
    try {
      const res = await api.uploadResume(file);
      if (res.success && res.resume) {
        setResumeData(res.resume);
        fetchQuestions();
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Failed to parse PDF resume.");
    } finally {
      setIsUploading(false);
    }
  };

  const fetchQuestions = async () => {
    setIsLoadingQuestions(true);
    try {
      const res = await api.generateResumeQuestions(5);
      if (res.success && res.questions) {
        setQuestions(res.questions);
        if (res.questions.length > 0 && !activeQuestion) {
          setActiveQuestion(res.questions[0]);
          setModelAnswer(res.questions[0].model_spoken_answer || "");
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  const handleSelectQuestion = (q) => {
    setActiveQuestion(q);
    setModelAnswer(q.model_spoken_answer || "");
    setActiveView("practice");
    setAnalysisResult(null);
  };

  const handleGenerateFreshAnswer = async () => {
    if (!activeQuestion?.question) return;
    setIsGeneratingAnswer(true);
    try {
      const res = await api.generateResumeAnswer(activeQuestion.question, activeQuestion.topic);
      if (res.success && res.data?.sample_answer) {
        setModelAnswer(res.data.sample_answer);
      }
    } catch (err) {
      console.warn("Failed to generate fresh resume answer:", err);
    } finally {
      setIsGeneratingAnswer(false);
    }
  };

  const handleRecordingComplete = async ({ audioBlob, fallbackTranscript, durationSeconds }) => {
    if (!activeQuestion) return;
    setIsAnalyzing(true);
    setErrorMsg("");
    try {
      const res = await api.analyzeResumeResponse({
        audioBlob,
        fallbackTranscript,
        question: activeQuestion.question,
        topic: activeQuestion.topic,
        durationSeconds,
      });

      if (res.success && res.analysis) {
        setAnalysisResult(res.analysis);
        setActiveView("results");
        if (onSessionSaved) onSessionSaved();
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Failed to evaluate response.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span className="badge badge-emerald">
              <FileCode2 size={12} /> Mode 3
            </span>
            <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Technical & Project Deep Dives</span>
          </div>
          <h1 style={{ fontSize: "2rem" }}>Resume-Based Mock Round</h1>
        </div>

        {resumeData && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn btn-secondary"
            style={{ gap: "8px" }}
          >
            <Upload size={16} />
            <span>Upload New Resume</span>
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          style={{ display: "none" }}
          onChange={(e) => handleFileUpload(e.target.files?.[0])}
        />
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

      {/* Case 1: No Resume Uploaded Yet */}
      {!resumeData && (
        <div
          className="glass-panel"
          style={{
            padding: "50px 30px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "20px",
            border: "2px dashed var(--border-subtle)",
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFileUpload(e.dataTransfer.files?.[0]);
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              background: "rgba(16, 185, 129, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--accent-emerald)",
            }}
          >
            <Upload size={32} />
          </div>

          <div>
            <h3 style={{ fontSize: "1.4rem", marginBottom: "8px" }}>
              Upload Your Resume (PDF)
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", maxWidth: "480px", margin: "0 auto" }}>
              Our AI analyzes your listed projects, technical skills, and experience to ask the exact questions a senior interviewer will challenge you on.
            </p>
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn btn-primary"
            disabled={isUploading}
            style={{ padding: "14px 32px", fontSize: "1rem" }}
          >
            {isUploading ? (
              <>
                <span className="spinner" />
                <span>Extracting Skills & Projects...</span>
              </>
            ) : (
              <>
                <Upload size={18} />
                <span>Choose PDF File</span>
              </>
            )}
          </button>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Drag & drop your PDF anywhere in this box</span>
        </div>
      )}

      {/* Case 2: Resume Loaded */}
      {resumeData && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Parsed Resume Overview Bar */}
          <div
            className="glass-panel"
            style={{
              padding: "24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "16px",
              borderLeft: "4px solid var(--accent-emerald)",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                <FileCheck size={18} color="var(--accent-emerald)" />
                <span style={{ fontWeight: "700", fontSize: "1.15rem" }}>
                  {resumeData.candidate_name || "Parsed Candidate Resume"}
                </span>
                <span className="badge badge-emerald">PDF Active</span>
              </div>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem" }}>
                Extracted: {resumeData.projects?.length || 0} Projects • {resumeData.skills?.technical?.length || 0} Tech Skills
              </p>
            </div>

            {/* Extracted Skill Badges */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", maxWidth: "550px" }}>
              {resumeData.skills?.technical?.slice(0, 8).map((skill, i) => (
                <span key={i} className="badge badge-indigo" style={{ fontSize: "0.72rem" }}>
                  {skill}
                </span>
              ))}
              {resumeData.skills?.tools?.slice(0, 4).map((tool, i) => (
                <span key={i} className="badge badge-cyan" style={{ fontSize: "0.72rem" }}>
                  {tool}
                </span>
              ))}
            </div>
          </div>

          {/* Active Question Stage */}
          {activeQuestion && (
            <div
              className="glass-panel-glow"
              style={{
                padding: "30px",
                borderLeft: "4px solid var(--accent-emerald)",
                display: "flex",
                flexDirection: "column",
                gap: "18px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span className="badge badge-emerald">{activeQuestion.category || "Technical Depth"}</span>
                  <span
                    className={
                      activeQuestion.difficulty === "Hard"
                        ? "badge badge-rose"
                        : activeQuestion.difficulty === "Medium"
                        ? "badge badge-amber"
                        : "badge badge-emerald"
                    }
                  >
                    {activeQuestion.difficulty || "Medium"}
                  </span>
                </div>
                <span style={{ fontSize: "0.85rem", color: "var(--accent-cyan)", fontWeight: "600" }}>
                  {activeQuestion.topic}
                </span>
              </div>

              <h2 style={{ fontSize: "1.65rem", lineHeight: "1.3" }}>
                "{activeQuestion.question}"
              </h2>

              {activeQuestion.hint && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                    background: "rgba(16, 185, 129, 0.06)",
                    border: "1px solid rgba(16, 185, 129, 0.2)",
                    padding: "12px 16px",
                    borderRadius: "var(--radius-md)",
                    fontSize: "0.9rem",
                    color: "var(--text-secondary)",
                  }}
                >
                  <HelpCircle size={18} color="var(--accent-emerald)" style={{ marginTop: "2px", flexShrink: 0 }} />
                  <div>
                    <strong style={{ color: "var(--accent-emerald)" }}>Interviewer's Focus: </strong>
                    {activeQuestion.hint}
                  </div>
                </div>
              )}

              {/* Sample key points candidate should touch on */}
              {activeQuestion.sample_key_points && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
                    Key points to cover:
                  </span>
                  {activeQuestion.sample_key_points.map((pt, i) => (
                    <span key={i} style={{ fontSize: "0.8rem", padding: "4px 10px", background: "rgba(255, 255, 255, 0.05)", borderRadius: "var(--radius-sm)", color: "var(--text-secondary)" }}>
                      ✓ {pt}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Ready-to-Speak Model Technical Answer for Confidence Practice */}
          {activeQuestion && activeView !== "results" && (
            <ModelAnswerCard
              answerText={modelAnswer}
              onGenerateAnswer={handleGenerateFreshAnswer}
              isGenerating={isGeneratingAnswer}
              mode="Resume Technical"
              tips={[
                "Notice how the answer emphasizes personal contribution, architecture, and trade-offs",
                "Use the '🔊 Listen' button to hear a confident, measured engineering cadence",
                "Practice reading this once or twice out loud before recording your answer"
              ]}
            />
          )}

          {/* Spoken Response / Evaluation Section */}
          <section>
            <div style={{ marginBottom: "14px" }}>
              <h3 style={{ fontSize: "1.3rem", marginBottom: "4px" }}>
                {activeView === "results" ? "Technical Response Evaluation" : "Record Your Answer"}
              </h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                {activeView === "results"
                  ? "Here is how clearly you explained your project implementation and problem-solving."
                  : "Speak for 1 to 2 minutes explaining your project decisions, challenges, and ownership."}
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
                onTryAgain={() => {
                  setActiveView("practice");
                  setAnalysisResult(null);
                }}
                mode="resume"
              />
            )}
          </section>

          {/* Generated Question Bank for Candidate's Projects */}
          <section style={{ marginTop: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <div>
                <h3 style={{ fontSize: "1.3rem" }}>Resume Question Bank</h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem" }}>
                  Click any question to practice answering it
                </p>
              </div>

              <button
                onClick={fetchQuestions}
                className="btn btn-secondary"
                disabled={isLoadingQuestions}
                style={{ gap: "6px" }}
              >
                <Sparkles size={14} className={isLoadingQuestions ? "spinner" : ""} />
                <span>Generate More Questions</span>
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {questions.map((q, idx) => {
                const isSelected = activeQuestion?.question === q.question;
                return (
                  <div
                    key={idx}
                    onClick={() => handleSelectQuestion(q)}
                    className="glass-panel"
                    style={{
                      padding: "18px 22px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "16px",
                      borderLeft: isSelected ? "4px solid var(--accent-emerald)" : "1px solid var(--border-subtle)",
                      background: isSelected ? "rgba(16, 185, 129, 0.08)" : "var(--bg-card)",
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span className="badge badge-emerald" style={{ fontSize: "0.7rem" }}>
                          {q.category || "Project"}
                        </span>
                        <span style={{ fontSize: "0.78rem", color: "var(--accent-cyan)", fontWeight: "600" }}>
                          {q.topic}
                        </span>
                      </div>
                      <div style={{ fontSize: "0.98rem", fontWeight: "600", color: "var(--text-primary)" }}>
                        {q.question}
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span
                        className={
                          q.difficulty === "Hard"
                            ? "badge badge-rose"
                            : q.difficulty === "Medium"
                            ? "badge badge-amber"
                            : "badge badge-emerald"
                        }
                      >
                        {q.difficulty}
                      </span>
                      <ChevronRight size={18} color="var(--text-muted)" />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
