import React, { useState, useRef, useEffect } from "react";
import {
  Mic,
  Square,
  RotateCcw,
  Send,
  AlertCircle,
  Volume2,
  FileText,
  Sparkles,
  Edit3
} from "lucide-react";
import { api } from "../api/client";

export default function AudioRecorder({
  onRecordingComplete,
  isAnalyzing = false,
  prepTimeSeconds = 0,
  maxDurationSeconds = 180, // 3 minutes max
}) {
  const [recordingState, setRecordingState] = useState("idle"); // idle, prep, recording, recorded
  const [countdown, setCountdown] = useState(prepTimeSeconds);
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState(null);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [transcribedText, setTranscribedText] = useState("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioBlobRef = useRef(null);
  const isRecordingRef = useRef(false);
  const startTimeRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const recognitionRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const canvasRef = useRef(null);

  // Setup Web Speech API for real-time live preview (Option B)
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onresult = (event) => {
          let currentTranscript = "";
          for (let i = 0; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript + " ";
          }
          const trimmed = currentTranscript.trim();
          setLiveTranscript(trimmed);
        };

        recognition.onerror = (err) => {
          console.warn("Web Speech API note:", err.error);
        };

        recognitionRef.current = recognition;
      } catch (e) {
        console.warn("SpeechRecognition init error:", e);
      }
    }

    return () => {
      stopAllTimers();
      stopAudioVisualizer();
      stopAllMediaTracks();
    };
  }, []);

  const stopAllTimers = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  };

  const stopAllMediaTracks = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  };

  const startVisualizer = (stream) => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const draw = () => {
        if (!analyserRef.current || !canvasRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        let sum = 0;
        const barWidth = (canvas.width / dataArray.length) * 1.5;
        let x = 0;

        for (let i = 0; i < dataArray.length; i++) {
          const val = dataArray[i];
          sum += val;
          const barHeight = (val / 255) * canvas.height * 0.9;

          const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
          gradient.addColorStop(0, "#6366f1");
          gradient.addColorStop(0.5, "#a855f7");
          gradient.addColorStop(1, "#06b6d4");

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.roundRect(x, canvas.height - barHeight, barWidth - 2, barHeight, [4, 4, 0, 0]);
          ctx.fill();

          x += barWidth;
        }

        const avg = sum / dataArray.length;
        setAudioLevel(avg);

        if (isRecordingRef.current) {
          animationFrameRef.current = requestAnimationFrame(draw);
        }
      };

      draw();
    } catch (e) {
      console.warn("Audio visualizer failed to start", e);
    }
  };

  const stopAudioVisualizer = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
  };

  const handleInitiateRecording = () => {
    setErrorMsg("");
    stopAllTimers();

    if (prepTimeSeconds > 0) {
      setRecordingState("prep");
      setCountdown(prepTimeSeconds);

      countdownIntervalRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (countdownIntervalRef.current) {
              clearInterval(countdownIntervalRef.current);
              countdownIntervalRef.current = null;
            }
            actuallyStartRecording();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      actuallyStartRecording();
    }
  };

  const actuallyStartRecording = async () => {
    try {
      stopAllTimers();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      audioChunksRef.current = [];
      setLiveTranscript("");
      setTranscribedText("");
      setDuration(0);

      let mimeType = "audio/webm";
      if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
        mimeType = "audio/webm;codecs=opus";
      } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
        mimeType = "audio/mp4";
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        audioBlobRef.current = audioBlob;
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);

        stopAllMediaTracks();
        stopAudioVisualizer();

        // Immediately auto-transcribe with Groq Whisper STT so candidate sees their speech!
        await autoTranscribeAudio(audioBlob);
      };

      mediaRecorder.start(250);
      startVisualizer(stream);

      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch {}
      }

      // Mark recording as active and record wall-clock start time
      isRecordingRef.current = true;
      startTimeRef.current = Date.now();
      setRecordingState("recording");

      // Interval calculates elapsed time from wall-clock to guarantee precision
      timerIntervalRef.current = setInterval(() => {
        if (!isRecordingRef.current || !startTimeRef.current) {
          if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
          }
          return;
        }

        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        if (elapsed >= maxDurationSeconds) {
          handleStopRecording();
        } else {
          setDuration(elapsed);
        }
      }, 250);
    } catch (err) {
      console.error("Microphone access error:", err);
      setErrorMsg("Microphone access denied or not found. Please allow microphone permissions in your browser.");
      isRecordingRef.current = false;
      startTimeRef.current = null;
      setRecordingState("idle");
    }
  };

  const autoTranscribeAudio = async (audioBlob) => {
    setIsTranscribing(true);
    try {
      const res = await api.transcribeAudio(audioBlob);
      if (res.success && res.text) {
        setTranscribedText(res.text);
      } else if (liveTranscript) {
        setTranscribedText(liveTranscript);
      }
    } catch (err) {
      console.warn("Groq Whisper auto-transcribe fallback:", err);
      if (liveTranscript) {
        setTranscribedText(liveTranscript);
      }
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleStopRecording = () => {
    // 1. Immediately freeze timer
    isRecordingRef.current = false;
    stopAllTimers();

    if (startTimeRef.current) {
      const finalDuration = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));
      setDuration(finalDuration);
      startTimeRef.current = null;
    }

    // 2. Stop media recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }

    // 3. Stop live speech recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }

    setRecordingState("recorded");
  };

  const handleReset = () => {
    isRecordingRef.current = false;
    startTimeRef.current = null;
    stopAllTimers();
    stopAudioVisualizer();
    stopAllMediaTracks();

    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    audioBlobRef.current = null;
    audioChunksRef.current = [];
    setDuration(0);
    setLiveTranscript("");
    setTranscribedText("");
    setRecordingState("idle");
    setErrorMsg("");
  };

  const handleSubmit = () => {
    const finalTranscript = transcribedText || liveTranscript;
    if (!audioBlobRef.current && !finalTranscript) {
      setErrorMsg("No audio or speech detected to submit.");
      return;
    }
    onRecordingComplete({
      audioBlob: audioBlobRef.current,
      fallbackTranscript: finalTranscript,
      durationSeconds: duration,
    });
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return `${mins}:${remSecs < 10 ? "0" : ""}${remSecs}`;
  };

  return (
    <div className="glass-panel" style={{ padding: "24px", position: "relative", overflow: "hidden" }}>
      {recordingState === "recording" && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "4px",
            background: "linear-gradient(90deg, #f43f5e, #a855f7, #06b6d4)",
            animation: "pulse-glow 1.5s infinite",
          }}
        />
      )}

      {errorMsg && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            background: "rgba(244, 63, 94, 0.15)",
            border: "1px solid rgba(244, 63, 94, 0.4)",
            borderRadius: "var(--radius-md)",
            padding: "12px 16px",
            color: "#fda4af",
            marginBottom: "16px",
            fontSize: "0.9rem",
          }}
        >
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* State 1: Prep Countdown */}
      {recordingState === "prep" && (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem", marginBottom: "8px" }}>
            Get ready to speak...
          </p>
          <div
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "4.5rem",
              fontWeight: "800",
              color: "var(--accent-primary)",
              textShadow: "0 0 30px rgba(99, 102, 241, 0.6)",
            }}
          >
            {countdown}
          </div>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
            Take a deep breath and organize your thoughts
          </p>
        </div>
      )}

      {/* State 2: Idle (Ready to start) */}
      {recordingState === "idle" && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", padding: "20px 0" }}>
          <button
            onClick={handleInitiateRecording}
            className="btn btn-primary"
            style={{
              padding: "16px 36px",
              fontSize: "1.1rem",
              borderRadius: "var(--radius-full)",
              gap: "12px",
            }}
          >
            <Mic size={22} />
            <span>Start Speaking</span>
          </button>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
            Speak into your microphone. Speech-to-Text will automatically transcribe your words.
          </p>
        </div>
      )}

      {/* State 3: Active Recording */}
      {recordingState === "recording" && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "18px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span
              style={{
                display: "inline-block",
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                backgroundColor: "#f43f5e",
                boxShadow: "0 0 12px #f43f5e",
              }}
            />
            <span style={{ fontFamily: "var(--font-heading)", fontSize: "1.6rem", fontWeight: "700" }}>
              {formatTime(duration)}
            </span>
            <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
              / {formatTime(maxDurationSeconds)}
            </span>
          </div>

          {/* Audio Visualizer Canvas */}
          <canvas
            ref={canvasRef}
            width={380}
            height={60}
            style={{
              width: "100%",
              maxWidth: "420px",
              height: "60px",
              borderRadius: "var(--radius-md)",
              background: "rgba(0, 0, 0, 0.2)",
            }}
          />

          {/* Real-time live speech preview while speaking */}
          {liveTranscript && (
            <div
              style={{
                width: "100%",
                maxWidth: "640px",
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px dashed var(--border-subtle)",
                borderRadius: "var(--radius-md)",
                padding: "12px 16px",
                fontSize: "0.92rem",
                color: "var(--text-secondary)",
                maxHeight: "90px",
                overflowY: "auto",
                fontStyle: "italic",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px", fontSize: "0.75rem", color: "var(--accent-cyan)", fontStyle: "normal" }}>
                <Volume2 size={12} /> Live Speech Detected:
              </div>
              "{liveTranscript}"
            </div>
          )}

          <button
            onClick={handleStopRecording}
            className="btn btn-danger"
            style={{
              padding: "12px 30px",
              borderRadius: "var(--radius-full)",
              gap: "10px",
            }}
          >
            <Square size={18} />
            <span>Finish Recording</span>
          </button>
        </div>
      )}

      {/* State 4: Recorded - Review What You Spoke & Submit */}
      {recordingState === "recorded" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          {/* Audio Player & Status Bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "12px",
              background: "rgba(0, 0, 0, 0.25)",
              padding: "14px 18px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span className="badge badge-emerald">Recorded</span>
              <span style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                Duration: <strong style={{ color: "var(--text-primary)" }}>{formatTime(duration)}</strong>
              </span>
            </div>

            {audioUrl && (
              <audio controls src={audioUrl} style={{ height: "36px", outline: "none", maxWidth: "280px" }} />
            )}
          </div>

          {/* Dedicated "What You Spoke" (Speech-to-Text) Card */}
          <div
            style={{
              background: "rgba(13, 19, 33, 0.75)",
              border: "1px solid rgba(6, 182, 212, 0.25)",
              borderRadius: "var(--radius-md)",
              padding: "18px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--accent-cyan)" }}>
                <FileText size={18} />
                <span style={{ fontWeight: "700", fontSize: "0.95rem" }}>
                  What You Spoke (Speech-to-Text Transcript):
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {isTranscribing ? (
                  <span className="badge badge-cyan" style={{ gap: "6px" }}>
                    <span className="spinner" style={{ width: "12px", height: "12px" }} />
                    Transcribing with Whisper...
                  </span>
                ) : (
                  <span className="badge badge-emerald">
                    {(transcribedText || liveTranscript).trim() ? `${(transcribedText || liveTranscript).trim().split(/\s+/).length} Words` : "No speech"}
                  </span>
                )}
              </div>
            </div>

            {/* Editable or viewable transcript area */}
            <textarea
              value={transcribedText || liveTranscript}
              onChange={(e) => {
                setTranscribedText(e.target.value);
                setLiveTranscript(e.target.value);
              }}
              rows={3}
              placeholder={isTranscribing ? "Listening to your recording and generating text..." : "Transcribed text will appear here. You can also edit this text if needed."}
              className="input-field"
              style={{
                width: "100%",
                background: "rgba(0, 0, 0, 0.3)",
                fontSize: "0.95rem",
                lineHeight: "1.6",
                borderRadius: "var(--radius-sm)",
                padding: "12px 14px",
                resize: "vertical",
                border: "1px solid var(--border-subtle)",
              }}
            />

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.78rem", color: "var(--text-muted)" }}>
              <span>💡 You can review or edit your spoken words above before submitting.</span>
              {audioBlobRef.current && (
                <button
                  type="button"
                  onClick={() => autoTranscribeAudio(audioBlobRef.current)}
                  disabled={isTranscribing}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--accent-cyan)",
                    cursor: "pointer",
                    textDecoration: "underline",
                    fontSize: "0.78rem",
                  }}
                >
                  Re-transcribe with Whisper
                </button>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "4px" }}>
            <button
              onClick={handleReset}
              className="btn btn-secondary"
              disabled={isAnalyzing || isTranscribing}
              style={{ gap: "8px" }}
            >
              <RotateCcw size={16} />
              <span>Record Again</span>
            </button>

            <button
              onClick={handleSubmit}
              className="btn btn-primary"
              disabled={isAnalyzing || isTranscribing || !(transcribedText || liveTranscript).trim()}
              style={{ gap: "8px", minWidth: "190px" }}
            >
              {isAnalyzing ? (
                <>
                  <span className="spinner" />
                  <span>AI Analyzing...</span>
                </>
              ) : (
                <>
                  <Send size={16} />
                  <span>Analyze My Answer</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
