// backend/services/youtubeConnection.js
const { listChatMessages } = require("./youtubeClient");

// Small helper so one bad handler doesn't crash polling
async function safeCall(fn, ...args) {
  try {
    await fn(...args);
  } catch (e) {
    console.error("[YouTubeConnection] handler error:", e.message);
  }
}

class YouTubeConnection {
  constructor() {
    this.connected = false;
    this.liveChatId = null;
    this.connectedBy = null;

    this.pollTimer = null;
    this.pageToken = null;
    this.seenMessageIds = new Set();
    this.defaultPollInterval = 2000;

    this.lastMessageAt = null;

    // subscribers that want chat messages
    this.handlers = new Set();
  }

  onMessage(handler) {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler); // unsubscribe function
  }

  async connect(liveChatId, connectedBy = "web") {
    if (!liveChatId) throw new Error("liveChatId is required");
    if (this.connected && this.liveChatId === liveChatId) return this.getState();

    this.disconnect(); // reset any existing connection

    this.connected = true;
    this.liveChatId = liveChatId;
    this.connectedBy = connectedBy;

    this.pageToken = null;
    this.seenMessageIds.clear();
    this.lastMessageAt = null;

    this.pollOnce();
    return this.getState();
  }

  disconnect() {
    this.connected = false;
    this.liveChatId = null;
    this.connectedBy = null;

    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }

    this.pageToken = null;
    this.seenMessageIds.clear();
    this.lastMessageAt = null;
  }

  getState() {
    return {
      connected: this.connected,
      liveChatId: this.liveChatId,
      connectedBy: this.connectedBy,
      lastMessageAt: this.lastMessageAt,
      handlerCount: this.handlers.size,
    };
  }

  async pollOnce() {
    if (!this.connected || !this.liveChatId) return;

    try {
      const { messages, nextPageToken, pollingIntervalMillis } =
        await listChatMessages(this.liveChatId, this.pageToken);

      if (nextPageToken) this.pageToken = nextPageToken;

      for (const msg of messages) {
        if (this.seenMessageIds.has(msg.id)) continue;
        this.seenMessageIds.add(msg.id);
        this.lastMessageAt = new Date().toISOString();

        // Broadcast to all handlers
        for (const handler of this.handlers) {
          await safeCall(handler, msg);
        }
      }

      const interval =
        typeof pollingIntervalMillis === "number" && pollingIntervalMillis > 0
          ? pollingIntervalMillis
          : this.defaultPollInterval;

      this.pollTimer = setTimeout(() => this.pollOnce(), interval);
    } catch (err) {
      console.error("[YouTubeConnection] poll error:", err.response?.data || err.message);
      this.pollTimer = setTimeout(() => this.pollOnce(), 5000);
    }
  }
}

module.exports = new YouTubeConnection();
