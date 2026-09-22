export function getApiBaseUrl() {
  const custom = typeof window !== "undefined" ? localStorage.getItem("prepai_custom_backend_url") : null;
  const raw = custom || import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
  const clean = raw.trim().replace(/\/$/, "");
  return (clean.startsWith("http://") || clean.startsWith("https://"))
    ? clean
    : `https://${clean}`;
}

export function setCustomBackendUrl(url) {
  if (url && url.trim()) {
    localStorage.setItem("prepai_custom_backend_url", url.trim().replace(/\/$/, ""));
  } else {
    localStorage.removeItem("prepai_custom_backend_url");
  }
}

export const API_BASE = getApiBaseUrl();

async function request(endpoint, options = {}) {
  const url = `${getApiBaseUrl()}${endpoint}`;
  const response = await fetch(url, options);
  if (!response.ok) {
    let errorDetail = "Server error occurred";
    try {
      const errData = await response.json();
      errorDetail = errData.detail || errorDetail;
    } catch {
      errorDetail = response.statusText;
    }
    throw new Error(errorDetail);
  }
  return response.json();
}

export const api = {
  // Config & Status
  async getConfigStatus() {
    return request("/api/history/config-status");
  },

  async testBackendUrl(testUrl) {
    const clean = (testUrl || "").trim().replace(/\/$/, "");
    const base = (clean.startsWith("http://") || clean.startsWith("https://")) ? clean : `https://${clean}`;
    const res = await fetch(`${base}/api/history/config-status`, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return res.json();
  },

  async setGroqApiKey(apiKey) {
    return request("/api/history/set-groq-key", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groq_api_key: apiKey }),
    });
  },

  // Direct STT Transcription
  async transcribeAudio(audioBlob) {
    const formData = new FormData();
    formData.append("audio", audioBlob, "speech.webm");
    return request("/api/stt/transcribe", {
      method: "POST",
      body: formData,
    });
  },

  // GD Practice
  async generateGDTopic(category = "trending", customPrompt = "") {
    return request("/api/gd/generate-topic", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, custom_prompt: customPrompt }),
    });
  },

  async generateGDAnswer(topic) {
    return request("/api/gd/generate-answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic }),
    });
  },

  async analyzeGDResponse({ audioBlob, fallbackTranscript, topic, durationSeconds }) {
    const formData = new FormData();
    if (audioBlob) {
      formData.append("audio", audioBlob, "gd_recording.webm");
    }
    formData.append("fallback_transcript", fallbackTranscript || "");
    formData.append("topic", topic);
    formData.append("duration_seconds", String(durationSeconds || 0));

    return request("/api/gd/analyze", {
      method: "POST",
      body: formData,
    });
  },

  // HR Interview
  async generateHRQuestion(category = "behavioral", customTopic = "") {
    return request("/api/hr/generate-question", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, custom_topic: customTopic }),
    });
  },

  async generateHRAnswer(question, category = "behavioral") {
    return request("/api/hr/generate-answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, category }),
    });
  },

  async analyzeHRResponse({ audioBlob, fallbackTranscript, question, category, durationSeconds }) {
    const formData = new FormData();
    if (audioBlob) {
      formData.append("audio", audioBlob, "hr_recording.webm");
    }
    formData.append("fallback_transcript", fallbackTranscript || "");
    formData.append("question", question);
    formData.append("category", category || "behavioral");
    formData.append("duration_seconds", String(durationSeconds || 0));

    return request("/api/hr/analyze", {
      method: "POST",
      body: formData,
    });
  },

  // Resume Practice
  async uploadResume(pdfFile) {
    const formData = new FormData();
    formData.append("file", pdfFile);
    return request("/api/resume/upload", {
      method: "POST",
      body: formData,
    });
  },

  async getCurrentResume() {
    return request("/api/resume/current");
  },

  async generateResumeQuestions(count = 5) {
    return request("/api/resume/generate-questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ count }),
    });
  },

  async generateResumeAnswer(question, topic = "Technical Project") {
    return request("/api/resume/generate-answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, topic }),
    });
  },

  async analyzeResumeResponse({ audioBlob, fallbackTranscript, question, topic, durationSeconds }) {
    const formData = new FormData();
    if (audioBlob) {
      formData.append("audio", audioBlob, "resume_recording.webm");
    }
    formData.append("fallback_transcript", fallbackTranscript || "");
    formData.append("question", question);
    formData.append("topic", topic || "Technical Discussion");
    formData.append("duration_seconds", String(durationSeconds || 0));

    return request("/api/resume/analyze", {
      method: "POST",
      body: formData,
    });
  },

  // History & Analytics
  async getSessions(limit = 50, mode = null) {
    const url = mode ? `/api/history/sessions?limit=${limit}&mode=${mode}` : `/api/history/sessions?limit=${limit}`;
    return request(url);
  },

  async getSessionDetail(sessionId) {
    return request(`/api/history/session/${sessionId}`);
  },

  async deleteSession(sessionId) {
    return request(`/api/history/session/${sessionId}`, { method: "DELETE" });
  },

  async getAnalytics() {
    return request("/api/history/analytics");
  },

  async resetAllData() {
    return request("/api/history/reset-all", { method: "POST" });
  },

  // Notes & Google Drive PDF Integration
  async getNotes(category = null, search = null, sortBy = "newest") {
    const params = new URLSearchParams();
    if (category && category !== "All") params.append("category", category);
    if (search && search.trim()) params.append("search", search.trim());
    if (sortBy) params.append("sort_by", sortBy);
    const queryString = params.toString();
    return request(`/api/notes${queryString ? `?${queryString}` : ""}`);
  },

  async getNoteCategories() {
    return request("/api/notes/categories");
  },

  async parseGDriveLink(gdriveUrl) {
    return request("/api/notes/parse-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gdrive_url: gdriveUrl }),
    });
  },

  async addNote({ gdriveUrl, title, fileName, category, description }) {
    return request("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gdrive_url: gdriveUrl,
        title: title || null,
        file_name: fileName || null,
        category: category || "General",
        description: description || "",
      }),
    });
  },

  async updateNote(noteId, { title, fileName, category, description }) {
    return request(`/api/notes/${noteId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        file_name: fileName,
        category,
        description,
      }),
    });
  },

  async deleteNote(noteId, password = "") {
    const query = password ? `?password=${encodeURIComponent(password)}` : "";
    return request(`/api/notes/${noteId}${query}`, {
      method: "DELETE",
    });
  },
};
