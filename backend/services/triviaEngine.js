// backend/services/triviaEngine.js
const { listChatMessages, sendChatMessage } = require("./youtubeClient");
const Question = require("../models/Question");
const Score = require("../models/Score");

class TriviaEngine {
  constructor() {
    this.running = false;
    this.liveChatId = null;

    this.currentQuestion = null; // full doc
    this.currentAnswer = "";
    this.questionAskedAt = null;
    this.questionAnswered = false;

    this.pollTimer = null;
    this.pageToken = null;
    this.seenMessageIds = new Set();

    this.defaultPollInterval = 2000;
    this.questionTimeoutMs = 30000; // 30s per question for now
    this.questionTimeoutTimer = null;
  }

  // ---------- PUBLIC API used by Express ----------

  async start(liveChatId) {
    if (!liveChatId) {
      throw new Error("liveChatId is required to start trivia");
    }

    console.log("[TriviaEngine] Starting with liveChatId:", liveChatId);

    this.liveChatId = liveChatId;
    this.running = true;
    this.pageToken = null;
    this.seenMessageIds.clear();

    await sendChatMessage(this.liveChatId, "Trivia Bot started! First question coming up...");
    await this.askNewQuestion();
    this.startPollingLoop();
  }

  stop() {
    console.log("[TriviaEngine] Stopping");
    this.running = false;
    this.liveChatId = null;

    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }
    if (this.questionTimeoutTimer) {
      clearTimeout(this.questionTimeoutTimer);
      this.questionTimeoutTimer = null;
    }

    this.currentQuestion = null;
    this.currentAnswer = "";
    this.questionAskedAt = null;
    this.questionAnswered = false;
    this.pageToken = null;
    this.seenMessageIds.clear();
  }

  isRunning() {
    return this.running;
  }

  getState() {
    return {
      running: this.running,
      liveChatId: this.liveChatId,
      currentQuestion: this.currentQuestion
        ? {
            id: this.currentQuestion._id,
            text: this.currentQuestion.questionText,
            answer: this.currentAnswer,
          }
        : null,
      questionAnswered: this.questionAnswered,
      questionAskedAt: this.questionAskedAt,
    };
  }

  // ---------- Internal helpers ----------

  async askNewQuestion() {
    if (!this.running || !this.liveChatId) return;

    // Clear any previous timeout
    if (this.questionTimeoutTimer) {
      clearTimeout(this.questionTimeoutTimer);
      this.questionTimeoutTimer = null;
    }

    // Pick a random question from Mongo
    const count = await Question.countDocuments();
    if (count === 0) {
      await sendChatMessage(this.liveChatId, "No trivia questions found in the database.");
      return;
    }

    const random = Math.floor(Math.random() * count);
    const q = await Question.findOne().skip(random);

    this.currentQuestion = q;
    this.currentAnswer = (q.answerText || "").trim();
    this.questionAnswered = false;
    this.questionAskedAt = new Date();

    console.log("[TriviaEngine] Asking question:", q.questionText, "| Answer:", this.currentAnswer);

    await sendChatMessage(this.liveChatId, `${q.questionText}?`);

    // Set a timeout for "time's up"
    this.questionTimeoutTimer = setTimeout(async () => {
      if (!this.running) return;
      if (!this.questionAnswered) {
        await sendChatMessage(
          this.liveChatId,
          `Time is up! The correct answer was: ${this.currentAnswer}`
        );
      }
      // Ask the next question
      await this.askNewQuestion();
    }, this.questionTimeoutMs);
  }

  startPollingLoop() {
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }
    this.pollOnce();
  }

  async pollOnce() {
    if (!this.running || !this.liveChatId) return;

    try {
      const { messages, nextPageToken, pollingIntervalMillis } =
        await listChatMessages(this.liveChatId, this.pageToken);

      // Advance the page token so we only see new messages
      this.pageToken = nextPageToken || this.pageToken;

      const interval =
        typeof pollingIntervalMillis === "number" && pollingIntervalMillis > 0
          ? pollingIntervalMillis
          : this.defaultPollInterval;

      // Process new messages
      for (const msg of messages) {
        if (this.seenMessageIds.has(msg.id)) continue;
        this.seenMessageIds.add(msg.id);

        await this.handleIncomingMessage(msg);
      }

      // Schedule the next poll
      this.pollTimer = setTimeout(() => this.pollOnce(), interval);
    } catch (err) {
      console.error("[TriviaEngine] Error in pollOnce:", err.response?.data || err.message);
      // Back off a bit if error
      this.pollTimer = setTimeout(() => this.pollOnce(), 5000);
    }
  }

  async handleIncomingMessage(msg) {
    if (!this.running || !this.currentQuestion) return;
    if (this.questionAnswered) return; // already answered

    const text = (msg.text || "").toLowerCase();
    const answer = this.currentAnswer.toLowerCase();

    // Simple substring match; you can improve this later (trim, punctuation, etc.)
    if (text.includes(answer) && answer.length > 0) {
      this.questionAnswered = true;

      const now = new Date();
      const delaySec = Math.round((now - this.questionAskedAt) / 1000);

      console.log(
        `[TriviaEngine] Correct answer from ${msg.author}: "${msg.text}" (${delaySec}s)`
      );

      await sendChatMessage(
        this.liveChatId,
        `You got it, ${msg.author}! [${delaySec}s] The correct answer was: ${this.currentAnswer}.`
      );

      // Award a point
      await this.addPoint(msg.author);

      // Ask the next question after a short pause
      setTimeout(() => {
        if (this.running) {
          this.askNewQuestion().catch((err) =>
            console.error("[TriviaEngine] Error asking next question:", err.message)
          );
        }
      }, 3000);
    }
  }

  async addPoint(userName) {
    try {
      let scoreDoc = await Score.findOne({ userName });

      if (!scoreDoc) {
        scoreDoc = await Score.create({ userName, score: 1 });
      } else {
        scoreDoc.score += 1;
        await scoreDoc.save();
      }

      console.log("[TriviaEngine] Updated score for", userName, "=>", scoreDoc.score);
    } catch (err) {
      console.error("[TriviaEngine] Error updating score:", err.message);
    }
  }
}

module.exports = new TriviaEngine();
