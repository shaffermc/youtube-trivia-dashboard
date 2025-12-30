import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "/trivia/api";

export default function GameControls() {
  const [status, setStatus] = useState("");
  const [running, setRunning] = useState(false);
  const [liveChatId, setLiveChatId] = useState("");

  // Load current state on mount
  useEffect(() => {
    fetch(`${API_BASE}/game/state`)
      .then(res => res.json())
      .then(data => setRunning(data.running))
      .catch(() => {});
  }, []);

  const startGame = async () => {
    setStatus("");

    if (!liveChatId.trim()) {
      setStatus("Enter a Live Chat ID first.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/game/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ liveChatId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start");

      setRunning(true);
      setStatus("Trivia started!");
    } catch (err) {
      console.error(err);
      setStatus(err.message);
    }
  };

  const stopGame = async () => {
    setStatus("");
    try {
      const res = await fetch(`${API_BASE}/game/stop`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to stop");

      setRunning(false);
      setStatus("Trivia stopped.");
    } catch (err) {
      console.error(err);
      setStatus(err.message);
    }
  };

  return (
    <div style={{ marginTop: 20, marginBottom: 20 }}>
      <h2>Trivia Controls</h2>

      <div style={{ marginBottom: 10 }}>
        <label>Live Chat ID:</label>
        <input
          type="text"
          value={liveChatId}
          onChange={(e) => setLiveChatId(e.target.value)}
          style={{ marginLeft: 8, width: "300px" }}
          placeholder="Paste your YouTube liveChatId"
        />
      </div>

      {!running ? (
        <button onClick={startGame}>Start Trivia</button>
      ) : (
        <button onClick={stopGame}>Stop Trivia</button>
      )}

      {status && (
        <div style={{ marginTop: 10 }}>
          {status}
        </div>
      )}
    </div>
  );
}
