import { useState, useEffect, useCallback } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "/trivia/api";

export default function ChatMessagesViewer() {
  const [liveChatId, setLiveChatId] = useState("");
  const [messages, setMessages] = useState([]);
  const [pageToken, setPageToken] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const [autoRefresh, setAutoRefresh] = useState(false);
  const [pollInterval, setPollInterval] = useState(2000);

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

        const res = await fetch(
          `${API_BASE}/youtube/chat?${params.toString()}`
        );
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
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Live Chat Monitor</h2>
        <span className="card-subtitle">
          See messages as they arrive from your livestream.
        </span>
      </div>

      <div className="form-row-inline">
        <div className="field" style={{ flex: 1 }}>
          <label className="field-label">Live Chat ID</label>
          <input
            className="input"
            type="text"
            value={liveChatId}
            onChange={(e) => setLiveChatId(e.target.value)}
            placeholder="Paste liveChatId here"
          />
        </div>

        <button
          className="btn"
          type="button"
          onClick={handleManualLoad}
          disabled={loading}
        >
          {loading ? "Loading…" : "Load"}
        </button>

        <label
          className="field-label"
          style={{ display: "flex", alignItems: "center", gap: 4 }}
        >
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
          />
          Auto refresh
        </label>
      </div>

      {status && <div className="status-text">{status}</div>}

      <div className="chat-scroll">
        {messages.length === 0 ? (
          <div className="empty-state">No messages loaded yet.</div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className="chat-message">
              <div className="chat-author">{m.author}</div>
              <div className="chat-text">{m.text}</div>
              <div className="chat-meta">{m.publishedAt}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
