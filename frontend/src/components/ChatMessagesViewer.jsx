import { useState, useEffect, useCallback } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "/trivia/api";

export default function ChatMessagesViewer() {
  const [liveChatId, setLiveChatId] = useState("");
  const [messages, setMessages] = useState([]);
  const [pageToken, setPageToken] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const [autoRefresh, setAutoRefresh] = useState(false);
  const [pollInterval, setPollInterval] = useState(2000); // default 2s

  const fetchMessages = useCallback(
    async (reset = false) => {
      if (!liveChatId.trim()) {
        setStatus("Enter a liveChatId first.");
        return;
      }

      setLoading(true);
      if (reset) setStatus("");

      try {
        const params = new URLSearchParams({ liveChatId });

        if (!reset && pageToken) {
          params.set("pageToken", pageToken);
        }

        const res = await fetch(`${API_BASE}/youtube/chat?${params.toString()}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to load chat");
        }

        const newMessages = data.messages || [];
        const nextToken = data.nextPageToken || "";
        const intervalMs = data.pollingIntervalMillis || 2000;

        setPollInterval(intervalMs);
        setPageToken(nextToken);

        setMessages((prev) => {
          if (reset) return newMessages;

          const seen = new Set(prev.map((m) => m.id));
          const deduped = newMessages.filter((m) => !seen.has(m.id));
          return [...prev, ...deduped];
        });

        setStatus(
          `Loaded ${newMessages.length} message(s)` +
            (nextToken ? " (live…)" : "")
        );
      } catch (err) {
        console.error("Chat load error:", err);
        setStatus(err.message || "Error loading chat");
      } finally {
        setLoading(false);
      }
    },
    [liveChatId, pageToken]
  );

  const handleManualLoad = () => {
    setMessages([]);
    setPageToken("");
    fetchMessages(true);
  };

  useEffect(() => {
    if (!autoRefresh || !liveChatId.trim()) return;

    let cancelled = false;
    let timerId;

    const tick = async () => {
      if (cancelled) return;
      await fetchMessages(false);
      if (!cancelled) timerId = setTimeout(tick, pollInterval);
    };

    timerId = setTimeout(tick, pollInterval);

    return () => {
      cancelled = true;
      if (timerId) clearTimeout(timerId);
    };
  }, [autoRefresh, liveChatId, pollInterval, fetchMessages]);

  return (
    <div style={{ marginTop: 30 }}>
      <h2>YouTube Live Chat Viewer</h2>

      <div style={{ marginBottom: 10 }}>
        <label>Live Chat ID: </label>
        <input
          type="text"
          value={liveChatId}
          onChange={(e) => setLiveChatId(e.target.value)}
          style={{ width: "320px", marginRight: 8 }}
          placeholder="Paste liveChatId here"
        />

        <button onClick={handleManualLoad} disabled={loading}>
          {loading ? "Loading..." : "Load Messages"}
        </button>

        <label style={{ marginLeft: 16 }}>
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
            style={{ marginRight: 4 }}
          />
          Auto refresh
        </label>
      </div>

      {status && <div style={{ marginBottom: 10 }}>{status}</div>}

      <div
        style={{
          maxHeight: "300px",
          overflowY: "auto",
          border: "1px solid #ccc",
          padding: "8px",
          maxWidth: "800px",
        }}
      >
        {messages.length === 0 ? (
          <p>No messages loaded.</p>
        ) : (
          messages.map((m) => (
            <div key={m.id} style={{ borderBottom: "1px solid #eee", padding: "4px 0" }}>
              <div style={{ fontWeight: "bold" }}>{m.author}</div>
              <div>{m.text}</div>
              <div style={{ fontSize: "0.8em", color: "#666" }}>
                {m.publishedAt}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
