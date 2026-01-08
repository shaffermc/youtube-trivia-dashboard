import { useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "/trivia/api";

export default function ConnectionInfoPanel({ onLoginUser }) {
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");

  const [liveChatId, setLiveChatId] = useState("");
  const [youtubeHost, setYoutubeHost] = useState("");
  const [delayMs, setDelayMs] = useState("30000");
  const [message, setMessage] = useState("");

  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState("");

  const [fetchingLiveChatId, setFetchingLiveChatId] = useState(false);

  const fetchLiveChatIdFromYouTube = async () => {
    try {
      setFetchingLiveChatId(true);
      setStatus("Checking for active livestream…");

      const res = await fetch(`${API_BASE}/youtube/live/active`);
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch active livestreams");
      }

      const items = Array.isArray(data.items) ? data.items : [];
      if (items.length === 0) {
        setStatus("No active livestream found.");
        return;
      }

      // Pick the first active broadcast (simple default)
      const first = items[0];

      if (!first.liveChatId) {
        setStatus(`Found an active stream, but chat is disabled (or no liveChatId).`);
        return;
      }

      setLiveChatId(first.liveChatId);
      setStatus(`LiveChatId loaded from: ${first.title || "active stream"}`);
    } catch (err) {
      console.error("fetchLiveChatIdFromYouTube error:", err);
      setStatus(err.message || "Error fetching liveChatId");
    } finally {
      setFetchingLiveChatId(false);
    }
  };

  const loadSettings = async () => {
    try {
      setStatus("Loading settings…");
      const res = await fetch(`${API_BASE}/settings/load`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userName, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load settings");

      setLiveChatId(data.liveChatId || "");
      setYoutubeHost(data.youtubeHostName || "");
      setDelayMs(String(data.questionDelayMs || 30000));
      setMessage(data.defaultMessage || "");

      if (onLoginUser) {
        onLoginUser(userName);
      }

      setStatus("Settings loaded.");
    } catch (err) {
      console.error("loadSettings error:", err);
      setStatus(err.message || "Error loading settings");
    }
  };

  const saveSettings = async () => {
    try {
      setStatus("Saving settings…");
      const res = await fetch(`${API_BASE}/settings/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName,
          password,
          liveChatId,
          youtubeHostName: youtubeHost,
          questionDelayMs: Number(delayMs) || 30000,
          defaultMessage: message,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save settings");
      setStatus("Settings saved.");
    } catch (err) {
      console.error("saveSettings error:", err);
      setStatus(err.message || "Error saving settings");
    }
  };

  const startTrivia = async () => {
    try {
      setStatus("Starting trivia…");
      const res = await fetch(`${API_BASE}/game/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          liveChatId,
          youtubeName: youtubeHost,
          delayMs: Number(delayMs) || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start trivia");
      setRunning(data.running);
      setStatus("Trivia started.");
    } catch (err) {
      console.error("startTrivia error:", err);
      setStatus(err.message || "Error starting trivia");
    }
  };

  const stopTrivia = async () => {
    try {
      setStatus("Stopping trivia…");
      const res = await fetch(`${API_BASE}/game/stop`, { method: "POST" });
      const data = await res.json();
      setRunning(data.running);
      setStatus("Trivia stopped.");
    } catch (err) {
      console.error("stopTrivia error:", err);
      setStatus("Error stopping trivia");
    }
  };

  const sendManualMessage = async () => {
    try {
      if (!liveChatId || !message.trim()) {
        setStatus("Need liveChatId and message.");
        return;
      }
      setStatus("Sending message…");
      const res = await fetch(`${API_BASE}/youtube/chat/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ liveChatId, message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send message");
      setStatus("Message sent.");
    } catch (err) {
      console.error("sendManualMessage error:", err);
      setStatus(err.message || "Error sending message");
    }
  };

  return (
    <>
      <div className="form-grid" style={{ marginBottom: 10 }}>
        <div className="field">
          <label className="field-label">User name</label>
          <input
            className="input"
            type="text"
            autoComplete="username"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
          />
        </div>

        <div className="field">
          <label className="field-label">Password</label>
          <input
            className="input"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
      </div>

      <div className="btn-row">
        <button className="btn btn-secondary" onClick={loadSettings}>
          Load settings
        </button>
        <button className="btn btn-secondary" onClick={saveSettings}>
          Save settings
        </button>
      </div>

      <hr className="section-divider" />

      <div className="form-grid">
        {/* Live Chat ID + NEW button next to it */}
        <div className="field">
          <label className="field-label">Live Chat ID</label>

          <div className="form-row-inline">
            <input
              className="input"
              type="text"
              value={liveChatId}
              onChange={(e) => setLiveChatId(e.target.value)}
              placeholder="Paste liveChatId"
              style={{ flex: 1 }}
            />

            <button
              className="btn btn-secondary"
              type="button"
              onClick={fetchLiveChatIdFromYouTube}
              disabled={fetchingLiveChatId}
            >
              {fetchingLiveChatId ? "Finding…" : "Use active stream"}
            </button>
          </div>

          <span className="field-help">
            Paste a liveChatId, or click “Use active stream” to fetch it automatically.
          </span>
        </div>

        <div className="field">
          <label className="field-label">YouTube Username (host)</label>
          <input
            className="input"
            type="text"
            value={youtubeHost}
            onChange={(e) => setYoutubeHost(e.target.value)}
            placeholder="Exact display name in chat"
          />
        </div>

        <div className="field">
          <label className="field-label">Delay between questions (ms)</label>
          <input
            className="input"
            type="number"
            value={delayMs}
            onChange={(e) => setDelayMs(e.target.value)}
          />
          <span className="field-help">
            Higher values slow the game down; 30,000 = 30 seconds.
          </span>
        </div>

        <div className="field">
          <label className="field-label">Bot / manual message</label>
          <input
            className="input"
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Manual message or default bot prompt"
          />
        </div>
      </div>

      <div className="btn-row">
        <button className="btn btn-secondary" onClick={sendManualMessage}>
          Send to chat
        </button>
      </div>

      <div className="btn-row" style={{ marginTop: 10 }}>
        <button className="btn" onClick={startTrivia} disabled={running}>
          Start trivia
        </button>
        <button
          className="btn btn-danger"
          onClick={stopTrivia}
          disabled={!running}
        >
          Stop trivia
        </button>
      </div>

      {status && (
        <div
          className={
            "status-text " +
            (status.toLowerCase().includes("error") ? "status-text-error" : "")
          }
        >
          {status}
        </div>
      )}
    </>
  );
}
