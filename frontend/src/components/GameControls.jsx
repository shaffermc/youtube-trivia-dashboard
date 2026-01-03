import { useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "/trivia/api";

export default function GameControls() {
  const [liveChatId, setLiveChatId] = useState("");
  const [youtubeName, setYoutubeName] = useState("");
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState("");

  const startGame = async () => {
    try {
      const res = await fetch(`${API_BASE}/game/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          liveChatId,
          youtubeName, // <--- send it
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start");
      setRunning(data.running);
      setStatus("Trivia started.");
    } catch (err) {
      console.error(err);
      setStatus(err.message);
    }
  };

  const stopGame = async () => {
    try {
      const res = await fetch(`${API_BASE}/game/stop`, {
        method: "POST",
      });
      const data = await res.json();
      setRunning(data.running);
      setStatus("Trivia stopped.");
    } catch (err) {
      console.error(err);
      setStatus("Failed to stop game");
    }
  };

  return (
    <div style={{ marginTop: 20 }}>
      <h2>Trivia Game Controls</h2>

      <div style={{ marginBottom: 8 }}>
        <label>Live Chat ID: </label>
        <input
          type="text"
          value={liveChatId}
          onChange={(e) => setLiveChatId(e.target.value)}
          style={{ width: "320px" }}
          placeholder="Paste liveChatId"
        />
      </div>

      <div style={{ marginBottom: 8 }}>
        <label>YouTube Username (host): </label>
        <input
          type="text"
          value={youtubeName}
          onChange={(e) => setYoutubeName(e.target.value)}
          style={{ width: "320px" }}
          placeholder="Exact display name in chat"
        />
      </div>

      <div style={{ marginBottom: 8 }}>
        <button onClick={startGame} disabled={running}>
          Start Trivia
        </button>
        <button
          onClick={stopGame}
          disabled={!running}
          style={{ marginLeft: 8 }}
        >
          Stop Trivia
        </button>
      </div>

      {status && <div>{status}</div>}
    </div>
  );
}
