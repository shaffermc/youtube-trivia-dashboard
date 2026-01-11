// backend/services/triviaEngine.js
const { sendChatMessage } = require("./youtubeClient");
const Question = require("../models/Question");
const Score = require("../models/Score");

class TriviaEngine {
  constructor() {
    this.running = false;

    // The chat we're attached to (comes from YouTubeConnection)
    this.liveChatId = null;

    // host to ignore
    this.youtubeName = null;

    this.currentQuestion = null;
    this.currentAnswer = "";
    this.questionAskedAt = null;
    this.questionAnswered = false;

    this.questionTimeoutMs = 30000;
    this.questionTimeoutTimer = null;

    this.totalQuestionsAsked = 0;
    this.totalQuestionsAnswered = 0;
    this.lastWinner = null;

    // Tracking who started it
    this.startedBy = null;      // "web" | "chat"
    this.startedByUser = null;  // name in chat, optional
  }

  // Called by /youtube/connect to bind the engine to the connection's chat ID
  attachToLiveChat(liveChatId) {
    if (this.running && this.liveChatId && this.liveChatId !== liveChatId) {
      // avoid switching streams mid-game
      this.stop();
    }
    this.liveChatId = liveChatId;
  }

  detachLiveChat() {
    this.liveChatId = null;
    // optional: stop trivia if disconnected
    this.stop();
  }

  async start({ youtubeName, delayMs, startedBy = "web", startedByUser = null } = {}) {
    if (!this.liveChatId) {
      throw new Error("Not connected to YouTube. Connect first.");
    }

    if (this.running) return;

    if (delayMs) {
      const n = Number(delayMs);
      if (Number.isFinite(n) && n > 1000) this.questionTimeoutMs = n;
    }

    this.youtubeName = youtubeName ? youtubeName.trim().toLowerCase() : null;

    this.running = true;
    this.startedBy = startedBy;
    this.startedByUser = startedByUser;

    // Reset game state
    this.currentQuestion = null;
    this.currentAnswer = "";
    this.questionAskedAt = null;
    this.questionAnswered = false;
    this.totalQuestionsAsked = 0;
    this.totalQuestionsAnswered = 0;
    this.lastWinner = null;

    await sendChatMessage(this.liveChatId, "Trivia Bot started! First question coming up...");
    await this.askNewQuestion();
  }

  stop({ stoppedBy = "web", stoppedByUser = null } = {}) {
    if (!this.running) return;

    this.running = false;

    if (this.questionTimeoutTimer) {
      clearTimeout(this.questionTimeoutTimer);
      this.questionTimeoutTimer = null;
    }

    this.currentQuestion = null;
    this.currentAnswer = "";
    this.questionAskedAt = null;
    this.questionAnswered = false;

    this.startedBy = null;
    this.startedByUser = null;

    // optional: announce stop
    if (this.liveChatId) {
      sendChatMessage(this.liveChatId, "Trivia stopped.").catch(() => {});
    }
  }

  isRunning() {
    return this.running;
  }

  getState() {
    return {
      running: this.running,
      liveChatId: this.liveChatId,
      startedBy: this.startedBy,
      startedByUser: this.startedByUser,
      youtubeName: this.youtubeName,
      currentQuestion: this.currentQuestion
        ? { id: this.currentQuestion._id, text: this.currentQuestion.questionText }
        : null,
      questionAnswered: this.questionAnswered,
      questionAskedAt: this.questionAskedAt,
      totalQuestionsAsked: this.totalQuestionsAsked,
      totalQuestionsAnswered: this.totalQuestionsAnswered,
      lastWinner: this.lastWinner,
    };
  }

  async postHighscores() {
    if (!this.liveChatId) return;

    const top = await Score.find().sort({ score: -1 }).limit(5);

    if (!top || top.length === 0) {
      await sendChatMessage(this.liveChatId, "No scores yet.");
      return;
    }

    const line = top
      .map((s, i) => `${i + 1}) ${s.userName}: ${s.score}`)
      .join(" | ");

    await sendChatMessage(this.liveChatId, `🏆 High Scores — ${line}`);
  }


  // This is the key: called by YouTubeConnection for every incoming message
  async onChatMessage(msg) {
    // Phase 1: command parsing (safe even if trivia isn't running)
    await this.handleCommands(msg);

    // Phase 2: answer checking (only when running)
    if (!this.running || !this.currentQuestion || this.questionAnswered) return;

    const text = (msg.text || "").toLowerCase();
    const answer = this.currentAnswer.toLowerCase();

    // ignore host messages
    const authorName = (msg.author || "").trim().toLowerCase();
    if (this.youtubeName && authorName === this.youtubeName) return;

    if (answer && text.includes(answer)) {
      this.questionAnswered = true;

      const now = new Date();
      const delaySec = this.questionAskedAt
        ? Math.round((now - this.questionAskedAt) / 1000)
        : 0;

      this.totalQuestionsAnswered++;
      this.lastWinner = {
        userName: msg.author,
        answer: this.currentAnswer,
        when: new Date(),
      };

      await sendChatMessage(
        this.liveChatId,
        `You got it, ${msg.author}! [${delaySec}s] The correct answer was: ${this.currentAnswer}.`
      );

      await this.addPoint(msg.author);

      setTimeout(() => {
        if (this.running) this.askNewQuestion().catch(() => {});
      }, 2000);
    }
  }

  async handleCommands(msg) {
    if (!this.liveChatId) return;

    const raw = (msg.text || "").trim();
    if (!raw.startsWith("!")) return;

    const text = raw.toLowerCase();
    const author = (msg.author || "").trim();

    // Examples:
    // !trivia start
    // !trivia stop
    // Later: !trivia status, !trivia next, etc.

    if (text === "!trivia start") {
      if (!this.running) {
        await this.start({ startedBy: "chat", startedByUser: author });
      }
      return;
    }

    if (text === "!trivia stop") {
      if (this.running) {
        this.stop({ stoppedBy: "chat", stoppedByUser: author });
      }
      return;
    }
    
    if (text === "!highscores" || text === "!highscore") {
      await this.postHighscores();
      return;
    }

  }

  async askNewQuestion() {
    if (!this.running || !this.liveChatId) return;

    if (this.questionTimeoutTimer) {
      clearTimeout(this.questionTimeoutTimer);
      this.questionTimeoutTimer = null;
    }

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
    this.totalQuestionsAsked++;

    await sendChatMessage(this.liveChatId, `${q.questionText}?`);

    this.questionTimeoutTimer = setTimeout(async () => {
      if (!this.running) return;
      if (!this.questionAnswered) {
        await sendChatMessage(
          this.liveChatId,
          `Time is up! The correct answer was: ${this.currentAnswer}`
        );
      }
      await this.askNewQuestion();
    }, this.questionTimeoutMs);
  }

  async addPoint(userName) {
    try {
      let scoreDoc = await Score.findOne({ userName });
      if (!scoreDoc) scoreDoc = await Score.create({ userName, score: 1 });
      else {
        scoreDoc.score += 1;
        await scoreDoc.save();
      }
    } catch (err) {
      console.error("[TriviaEngine] Error updating score:", err.message);
    }
  }
}

module.exports = new TriviaEngine();
