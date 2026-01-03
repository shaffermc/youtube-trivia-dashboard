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

  // Load saved settings from backend
  const loadSettings = async () => {
    try {
      setStatus("Loading settings...");
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

  // Save current settings to backend
  const saveSettings = async () => {
    try {
      setStatus("Saving settings...");
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
      setStatus("Starting trivia...");
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
      setStatus("Stopping trivia...");
      const res = await fetch(`${API_BASE}/game/stop`, {
        method: "POST",
      });
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
        setStatus("Need liveChatId and message");
        return;
      }
      setStatus("Sending message...");
      const res = await fetch(`${API_BASE}/youtube/chat/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          liveChatId,
          message,
        }),
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
    <div style={{ border: "1px solid #ccc", padding: 16, marginBottom: 20 }}>
      <h1>Youtube Chat Trivia</h1>
      <h2>Connection Info</h2>

      <div style={{ marginBottom: 8 }}>
        <label style={{ width: 120, display: "inline-block" }}>User name:</label>
        <input
          type="text"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          style={{ width: 200 }}
        />
      </div>

      <div style={{ marginBottom: 8 }}>
        <label style={{ width: 120, display: "inline-block" }}>Password:</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: 200 }}
        />
        <button onClick={loadSettings} style={{ marginLeft: 8 }}>
          Load settings
        </button>
        <button onClick={saveSettings} style={{ marginLeft: 8 }}>
          Save settings
        </button>
      </div>

      <div style={{ marginBottom: 8 }}>
        <label style={{ width: 120, display: "inline-block" }}>Live Chat ID:</label>
        <input
          type="text"
          value={liveChatId}
          onChange={(e) => setLiveChatId(e.target.value)}
          style={{ width: 400 }}
          placeholder="Paste liveChatId"
        />
      </div>

      <div style={{ marginBottom: 8 }}>
        <label style={{ width: 120, display: "inline-block" }}>
          Youtube Username (host):
        </label>
        <input
          type="text"
          value={youtubeHost}
          onChange={(e) => setYoutubeHost(e.target.value)}
          style={{ width: 300 }}
          placeholder="Exact display name in chat"
        />
      </div>

      <div style={{ marginBottom: 8 }}>
        <label style={{ width: 120, display: "inline-block" }}>
          Delay between questions (ms):
        </label>
        <input
          type="number"
          value={delayMs}
          onChange={(e) => setDelayMs(e.target.value)}
          style={{ width: 120 }}
        />
      </div>

      <div style={{ marginBottom: 8 }}>
        <label style={{ width: 120, display: "inline-block" }}>Message:</label>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          style={{ width: 400 }}
          placeholder="Manual message or default bot message"
        />
        <button onClick={sendManualMessage} style={{ marginLeft: 8 }}>
          Send
        </button>
      </div>

      <div style={{ marginBottom: 8 }}>
        <button onClick={startTrivia} disabled={running}>
          Start trivia
        </button>
        <button onClick={stopTrivia} disabled={!running} style={{ marginLeft: 8 }}>
          Stop trivia
        </button>
      </div>

      {status && <div style={{ marginTop: 8 }}>Status: {status}</div>}
    </div>
  );
}
