import React, { useState, useEffect } from "react";
import {
  Volume2,
  VolumeX,
  Copy,
  Check,
  Sparkles,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  HeartHandshake,
  MessageSquare
} from "lucide-react";

export default function ModelAnswerCard({
  answerText,
  onGenerateAnswer,
  isGenerating = false,
  mode = "GD",
  tips = []
}) {
  const [isOpen, setIsOpen] = useState(true);
  const [isPlayingTTS, setIsPlayingTTS] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Stop speech when unmounting or changing answer
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [answerText]);

  const handleToggleSpeech = () => {
    if (!window.speechSynthesis) {
      alert("Text-to-Speech is not supported in this browser.");
      return;
    }

    if (isPlayingTTS) {
      window.speechSynthesis.cancel();
      setIsPlayingTTS(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(answerText);
    utterance.rate = 0.92; // Natural, steady interview pace
    utterance.pitch = 1.0;
    utterance.lang = "en-US";

    // Select a good English voice if available
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(
      (v) => v.lang.startsWith("en") && (v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Samantha"))
    ) || voices.find((v) => v.lang.startsWith("en"));

    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    utterance.onstart = () => setIsPlayingTTS(true);
    utterance.onend = () => setIsPlayingTTS(false);
    utterance.onerror = () => setIsPlayingTTS(false);

    window.speechSynthesis.speak(utterance);
  };

  const handleCopy = () => {
    if (!answerText) return;
    navigator.clipboard.writeText(answerText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div
      className="glass-panel"
      style={{
        border: "1px solid rgba(16, 185, 129, 0.35)",
        background: "linear-gradient(135deg, rgba(16, 185, 129, 0.06) 0%, rgba(18, 25, 43, 0.9) 100%)",
        padding: "clamp(16px, 3.5vw, 20px)",
        borderRadius: "var(--radius-md)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "10px",
          cursor: "pointer",
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: "1 1 240px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "rgba(16, 185, 129, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--accent-emerald)",
              flexShrink: 0,
            }}
          >
            <Sparkles size={18} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <h4 style={{ fontSize: "clamp(0.98rem, 2.5vw, 1.05rem)", color: "var(--text-primary)" }}>
                Ideal Spoken Answer (Practice Aloud)
              </h4>
              <span className="badge badge-emerald" style={{ fontSize: "0.68rem" }}>
                Confidence Builder
              </span>
            </div>
            <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
              Read aloud to build verbal flow before recording your response
            </span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginLeft: "auto" }}>
          {onGenerateAnswer && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onGenerateAnswer();
              }}
              disabled={isGenerating}
              className="btn btn-secondary"
              style={{ padding: "6px 12px", fontSize: "0.8rem", gap: "6px", minHeight: "unset" }}
            >
              <RefreshCw size={13} className={isGenerating ? "spinner" : ""} />
              <span>{isGenerating ? "Drafting..." : "New Version"}</span>
            </button>
          )}

          <div style={{ color: "var(--text-muted)", marginLeft: "4px" }}>
            {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </div>
      </div>

      {/* Expandable Body */}
      {isOpen && (
        <div style={{ marginTop: "14px", display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* Answer Text Area */}
          <div
            style={{
              padding: "14px 16px",
              background: "rgba(0, 0, 0, 0.35)",
              borderLeft: "3px solid var(--accent-emerald)",
              borderRadius: "var(--radius-sm)",
              fontSize: "clamp(0.92rem, 2.2vw, 0.98rem)",
              lineHeight: "1.75",
              color: "var(--text-primary)",
              fontFamily: "var(--font-sans)",
            }}
          >
            {answerText || (
              <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>
                Click "New Version" above to create an ideal spoken answer for this question.
              </span>
            )}
          </div>

          {/* Action Toolbar */}
          {answerText && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                {/* Text to Speech Button */}
                <button
                  type="button"
                  onClick={handleToggleSpeech}
                  className={isPlayingTTS ? "btn btn-danger" : "btn btn-emerald"}
                  style={{ padding: "8px 16px", fontSize: "0.85rem", gap: "8px", minHeight: "40px" }}
                >
                  {isPlayingTTS ? (
                    <>
                      <VolumeX size={16} />
                      <span>Stop Listening</span>
                    </>
                  ) : (
                    <>
                      <Volume2 size={16} />
                      <span>🔊 Listen to Audio</span>
                    </>
                  )}
                </button>

                {/* Copy Button */}
                <button
                  type="button"
                  onClick={handleCopy}
                  className="btn btn-secondary"
                  style={{ padding: "8px 14px", fontSize: "0.85rem", gap: "6px", minHeight: "40px" }}
                >
                  {isCopied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                  <span>{isCopied ? "Copied!" : "Copy"}</span>
                </button>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                <HeartHandshake size={15} color="var(--accent-emerald)" />
                <span>Tip: Read aloud once or twice to banish hesitation!</span>
              </div>
            </div>
          )}

          {/* Tips if present */}
          {tips && tips.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "2px" }}>
              {tips.map((t, i) => (
                <span key={i} style={{ fontSize: "0.76rem", padding: "4px 8px", background: "rgba(255, 255, 255, 0.04)", borderRadius: "var(--radius-sm)", color: "var(--text-secondary)" }}>
                  💡 {t}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
