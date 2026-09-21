import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import GDPractice from "./pages/GDPractice";
import HRInterview from "./pages/HRInterview";
import ResumeInterview from "./pages/ResumeInterview";
import Analytics from "./pages/Analytics";
import { api } from "./api/client";
import { Heart } from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [configStatus, setConfigStatus] = useState(null);
  const [analytics, setAnalytics] = useState(null);

  // Sync hash routing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "");
      if (["dashboard", "gd", "hr", "resume", "analytics"].includes(hash)) {
        setActiveTab(hash);
      }
    };

    if (window.location.hash) {
      handleHashChange();
    }

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    window.location.hash = tabId;
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // On every page refresh / load, reset all stored JSON files to manage storage
  useEffect(() => {
    const handleInitialLoadAndReset = async () => {
      try {
        await api.resetAllData();
      } catch (err) {
        console.warn("Storage reset on refresh warning:", err);
      }
      fetchInitialData();
    };

    handleInitialLoadAndReset();

    // Trigger cleanup immediately when the page is refreshing or unloading
    const handleBeforeUnload = () => {
      try {
        fetch("http://127.0.0.1:8000/api/history/reset-all", {
          method: "POST",
          keepalive: true,
        });
      } catch {
        // Ignore unload network errors
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  const fetchInitialData = async () => {
    try {
      const [cfg, ana] = await Promise.all([
        api.getConfigStatus().catch(() => ({ success: false, is_configured: false })),
        api.getAnalytics().catch(() => ({ success: false, analytics: null })),
      ]);
      if (cfg && cfg.success) setConfigStatus(cfg);
      if (ana && ana.success) setAnalytics(ana.analytics);
    } catch (e) {
      console.warn("Initial data fetch warning:", e);
    }
  };

  const handleManualStorageReset = async () => {
    if (confirm("Clear all stored session and resume JSON data now?")) {
      try {
        await api.resetAllData();
        await fetchInitialData();
        alert("Storage cleared successfully! All JSON files removed.");
      } catch (e) {
        console.error("Storage reset failed:", e);
      }
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Navbar Header */}
      <Navbar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        configStatus={configStatus}
        onResetStorage={handleManualStorageReset}
      />

      {/* Main Content Area */}
      <main
        style={{
          flex: 1,
          maxWidth: "1320px",
          width: "100%",
          margin: "0 auto",
          padding: "36px 20px 60px 20px",
        }}
      >
        {activeTab === "dashboard" && (
          <Dashboard
            onNavigate={handleTabChange}
            analytics={analytics}
            configStatus={configStatus}
          />
        )}

        {activeTab === "gd" && (
          <GDPractice
            onSessionSaved={fetchInitialData}
          />
        )}

        {activeTab === "hr" && (
          <HRInterview
            onSessionSaved={fetchInitialData}
          />
        )}

        {activeTab === "resume" && (
          <ResumeInterview
            onSessionSaved={fetchInitialData}
          />
        )}

        {activeTab === "analytics" && (
          <Analytics />
        )}
      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop: "1px solid var(--border-subtle)",
          background: "rgba(10, 13, 23, 0.9)",
          padding: "24px 20px",
          textAlign: "center",
          fontSize: "0.85rem",
          color: "var(--text-muted)",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <strong>PrepAI</strong> • Personal Pre-Placement Preparation Assistant
          </div>
          <div>
            Powered by <strong>Groq Whisper & LPU</strong> + <strong>FastAPI</strong> + <strong>React</strong>
          </div>
        </div>
      </footer>
    </div>
  );
}
