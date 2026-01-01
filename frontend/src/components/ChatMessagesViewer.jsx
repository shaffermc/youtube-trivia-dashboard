import { useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "/trivia/api";

export default function ChatMessagesViewer() {
  const [liveChatId, setLiveChatId] = useState("");
  const [messages, setMessages] = useState([]);
  const [pageToken, setPageToken] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchMessages = async (useNextPage) => {
    if (!liveChatId.trim()) {
      setStatus("Enter a liveChatId first.");
      return;
    }

    setLoading(true);
    setStatus("");

    try {
      const params = new URLSearchParams({ liveChatId });
      if (useNextPage && pageToken) {
        params.set("pageToken", pageToken);
      }

      const res = await fetch(`${API_BASE}/youtube/chat?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load chat");
      }

      setMessages(data.messages || []);
      setPageToken(data.nextPageToken || "");
      setStatus(
        `Loaded ${data.messages?.length || 0} messages` +
          (data.nextPageToken ? " (more available)" : "")
      );
    } catch (err) {
      console.error("Chat load error:", err);
      setStatus(err.message || "Error loading chat");
    } finally {
      setLoading(false);
    }
  };

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
        <button onClick={() => fetchMessages(false)} disabled={loading}>
          {loading ? "Loading..." : "Load Messages"}
        </button>
        {pageToken && (
          <button
            onClick={() => fetchMessages(true)}
            style={{ marginLeft: 8 }}
            disabled={loading}
          >
            Next Page
          </button>
        )}
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
            <div
              key={m.id}
              style={{
                borderBottom: "1px solid #eee",
                padding: "4px 0",
              }}
            >
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
