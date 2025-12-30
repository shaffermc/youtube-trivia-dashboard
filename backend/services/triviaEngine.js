// backend/services/triviaEngine.js
const Question = require("../models/Question");
const Score = require("../models/Score");
const { getYouTubeClient, sendChatMessage, fetchNewMessages } = require("./youtubeClient");

class TriviaEngine {
  constructor() {
    this.running = false;
    this.currentQuestion = null;
    this.currentAnswer = null;
    this.currentQuestionId = null;
    this.stage = 0;
    this.questionAnswered = false;
    this.askTime = null;
    this.hint1 = "";
    this.questionTimer = null;
    this.pollTimer = null;
    this.liveChatId = null; // set when starting
    this.lastPageToken = null;
  }

  async start(liveChatId) {
    if (this.running) return;
    this.running = true;
    this.liveChatId = liveChatId;
    this.stage = 0;
    this.questionAnswered = false;

    await this._loadNewQuestion();

    // Ask question / hint cycle every 10s (like your C#)
    this.questionTimer = setInterval(() => this._questionTick(), 10_000);

    // Poll YouTube chat every 2s
    this.pollTimer = setInterval(() => this._pollChat(), 2_000);

    await sendChatMessage(this.liveChatId, "Trivia started! First question coming up...");
  }

  stop() {
    this.running = false;
    if (this.questionTimer) clearInterval(this.questionTimer);
    if (this.pollTimer) clearInterval(this.pollTimer);
    this.questionTimer = null;
    this.pollTimer = null;
  }

  isRunning() {
    return this.running;
  }

  getState() {
    return {
      running: this.running,
      currentQuestion: this.currentQuestion,
      stage: this.stage,
      questionAnswered: this.questionAnswered,
      askTime: this.askTime,
    };
  }

  async _loadNewQuestion() {
    const count = await Question.countDocuments();
    if (!count) {
      this.currentQuestion = "No questions yet";
      this.currentAnswer = "";
      this.currentQuestionId = null;
      return;
    }

    const randomSkip = Math.floor(Math.random() * count);
    const q = await Question.findOne().skip(randomSkip);

    this.currentQuestion = q.questionText;
    this.currentAnswer = q.answerText;
    this.currentQuestionId = q._id;

    // Hint: first + last letter, rest underscores
    this.hint1 = this.currentAnswer.replace(
      /(?<=.)(.?)(?=.*$)/g, // simple-ish mask
      (m, ch, idx) => (ch === " " ? " " : "_")
    );

    this.stage = 0;
    this.questionAnswered = false;
  }

  async _questionTick() {
    if (!this.running || !this.currentQuestion) return;

    try {
      if (this.stage === 0) {
        this.stage = 1;
        this.askTime = new Date();
        await sendChatMessage(this.liveChatId, `${this.currentQuestion}?`);
      } else if (this.stage === 1) {
        this.stage = 2;
        await sendChatMessage(this.liveChatId, `Hint: ${this.hint1}`);
      } else if (this.stage === 2) {
        // time up, reveal answer, load next
        await sendChatMessage(
          this.liveChatId,
          `Time is up! The correct answer was: ${this.currentAnswer}`
        );
        await this._loadNewQuestion();
      }
    } catch (err) {
      console.error("Question tick error:", err);
    }
  }

  async _pollChat() {
    if (!this.running || !this.currentAnswer || !this.liveChatId) return;

    try {
      const { messages, nextPageToken } = await fetchNewMessages(
        this.liveChatId,
        this.lastPageToken
      );
      this.lastPageToken = nextPageToken;

      for (const msg of messages) {
        const { displayName, displayMessage, publishedAt } = msg;

        // ignore our own bot messages
        if (displayName === "Trivia Bot") continue;

        // commands
        if (displayMessage.includes("!stop")) {
          this.stop();
          await sendChatMessage(this.liveChatId, `Trivia stopped by ${displayName}`);
          return;
        }

        // answer check
        if (
          displayMessage.toLowerCase().includes(this.currentAnswer.toLowerCase()) &&
          !this.questionAnswered
        ) {
          this.questionAnswered = true;

          const delaySec = Math.floor((Date.now() - new Date(publishedAt).getTime()) / 1000);
          await sendChatMessage(
            this.liveChatId,
            `You got it, ${displayName}! [${delaySec}s] The correct answer was: ${this.currentAnswer}.`
          );

          await this._awardPoint(displayName);
          await this._loadNewQuestion(); // next question
          break;
        }
      }
    } catch (err) {
      console.error("Poll chat error:", err);
    }
  }

  async _awardPoint(userName) {
    // upsert score
    await Score.findOneAndUpdate(
      { userName },
      { $inc: { score: 1 } },
      { upsert: true, new: true }
    );
  }
}

module.exports = new TriviaEngine();
