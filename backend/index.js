require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const Score = require("./models/Score");
const Question = require("./models/Question");
const triviaEngine = require("./services/triviaEngine");
const Settings = require("./models/Settings");

const { listChatMessages, sendChatMessage } = require("./services/youtubeClient");


const app = express();
app.use(cors());
app.use(express.json());

const mongoURI = process.env.MONGODB_URI;

console.log("Mongo URI:", mongoURI);

mongoose
  .connect(mongoURI, { serverSelectionTimeoutMS: 5000 })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
  });

// --- Simple health route ---
app.get("/", (req, res) => {
  res.json({ message: "Trivia backend is running" });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Load settings by userName/password
app.post("/settings/load", async (req, res) => {
  try {
    const { userName, password } = req.body;
    if (!userName || !password) {
      return res.status(400).json({ error: "userName and password are required" });
    }

    const settings = await Settings.findOne({ userName, password });
    if (!settings) {
      return res.status(404).json({ error: "Settings not found" });
    }

    res.json({
      userName: settings.userName,
      liveChatId: settings.liveChatId || "",
      youtubeHostName: settings.youtubeHostName || "",
      questionDelayMs: settings.questionDelayMs || 30000,
      defaultMessage: settings.defaultMessage || "",
    });
  } catch (err) {
    console.error("Load settings error:", err.message);
    res.status(500).json({ error: "Failed to load settings" });
  }
});

// Save/update settings for this user
app.post("/settings/save", async (req, res) => {
  try {
    const {
      userName,
      password,
      liveChatId,
      youtubeHostName,
      questionDelayMs,
      defaultMessage,
    } = req.body;

    if (!userName || !password) {
      return res.status(400).json({ error: "userName and password are required" });
    }

    const settings = await Settings.findOneAndUpdate(
      { userName, password },
      {
        userName,
        password,
        liveChatId,
        youtubeHostName,
        questionDelayMs,
        defaultMessage,
      },
      { upsert: true, new: true }
    );

    res.json({ ok: true });
  } catch (err) {
    console.error("Save settings error:", err.message);
    res.status(500).json({ error: "Failed to save settings" });
  }
});


// Add a new question
app.post("/questions", async (req, res) => {
  try {
    const { questionText, answerText } = req.body;

    if (!questionText || !answerText) {
      return res.status(400).json({ error: "questionText and answerText are required" });
    }

    const question = await Question.create({
      questionText,
      answerText,
      createdBy: "dashboard", // optional
    });

    res.status(201).json(question);
  } catch (err) {
    console.error("Error creating question:", err);
    res.status(500).json({ error: "Failed to create question" });
  }
});

// Get all questions
app.get("/questions", async (req, res) => {
  try {
    const questions = await Question.find().sort({ createdAt: -1 });
    res.json(questions);
  } catch (err) {
    console.error("Error fetching questions:", err);
    res.status(500).json({ error: "Failed to fetch questions" });
  }
});

// Update a question
app.put("/questions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { questionText, answerText } = req.body;

    if (!questionText || !answerText) {
      return res
        .status(400)
        .json({ error: "questionText and answerText are required" });
    }

    const updated = await Question.findByIdAndUpdate(
      id,
      { questionText, answerText },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: "Question not found" });
    }

    res.json(updated);
  } catch (err) {
    console.error("Error updating question:", err);
    res.status(500).json({ error: "Failed to update question" });
  }
});

// Delete a question
app.delete("/questions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Question.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ error: "Question not found" });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Error deleting question:", err);
    res.status(500).json({ error: "Failed to delete question" });
  }
});

app.get("/scores/highscores", async (req, res) => {
  try {
    const highs = await Score.find().sort({ score: -1 }).limit(5);
    res.json(highs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load highscores" });
  }
});

app.post("/game/start", async (req, res) => {
  try {
    const { liveChatId, youtubeName, delayMs } = req.body;

    if (!liveChatId) {
      return res.status(400).json({ error: "liveChatId is required" });
    }

    await triviaEngine.start(liveChatId, youtubeName, delayMs);

    res.json({ running: triviaEngine.isRunning() });
  } catch (err) {
    console.error("Start game error:", err);
    res.status(500).json({ error: "Failed to start game" });
  }
});


// Stop trivia
app.post("/game/stop", (req, res) => {
  triviaEngine.stop();
  res.json({ running: triviaEngine.isRunning() });
});

// Get current game state
app.get("/game/state", (req, res) => {
  res.json(triviaEngine.getState());
});

// Get recent YouTube chat messages by liveChatId
app.get("/youtube/chat", async (req, res) => {
  try {
    const { liveChatId, pageToken } = req.query;

    if (!liveChatId) {
      return res.status(400).json({ error: "liveChatId is required" });
    }

    const data = await listChatMessages(liveChatId, pageToken);
    res.json(data);
  } catch (err) {
    console.error("Error fetching chat messages:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch chat messages" });
  }
});

app.post("/youtube/chat/send", async (req, res) => {
  try {
    const { liveChatId, message } = req.body;

    if (!liveChatId || !message) {
      return res
        .status(400)
        .json({ error: "liveChatId and message are required" });
    }

    const result = await sendChatMessage(liveChatId, message);
    res.json({ success: true, messageId: result.id });
  } catch (err) {
    console.error("Error sending chat message:");
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "Failed to send chat message" });
  }
});

app.post("/settings/save", async (req, res) => {
  const { userName, password, liveChatId, youtubeHostName, questionDelayMs, defaultMessage } =
    req.body;

  try {
    const settings = await Settings.findOneAndUpdate(
      { userName },
      { userName, password, liveChatId, youtubeHostName, questionDelayMs, defaultMessage },
      { upsert: true, new: true }
    );
    res.json(settings);
  } catch (err) {
    console.error("Save settings error:", err.message);
    res.status(500).json({ error: "Failed to save settings" });
  }
});

// Load settings
app.post("/settings/load", async (req, res) => {
  const { userName, password } = req.body;
  try {
    const settings = await Settings.findOne({ userName, password });
    if (!settings) return res.status(404).json({ error: "Settings not found" });
    res.json(settings);
  } catch (err) {
    console.error("Load settings error:", err.message);
    res.status(500).json({ error: "Failed to load settings" });
  }
});

app.post("/questions/bulk", async (req, res) => {
  try {
    const { lines } = req.body; // array of strings e.g. "What is 2+2#4"
    if (!Array.isArray(lines)) {
      return res.status(400).json({ error: "lines must be an array" });
    }

    const docs = lines
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && line.includes("#"))
      .map((line) => {
        const [q, a] = line.split("#");
        return { questionText: q.trim(), answerText: a.trim() };
      });

    const inserted = await Question.insertMany(docs);
    res.json({ inserted: inserted.length });
  } catch (err) {
    console.error("Bulk import error:", err.message);
    res.status(500).json({ error: "Failed to import questions" });
  }
});

app.get("/questions/export", async (req, res) => {
  try {
    const questions = await Question.find();
    const lines = questions.map(
      (q) => `${q.questionText}#${q.answerText}`
    );
    const content = lines.join("\n");

    res.setHeader("Content-Type", "text/plain");
    res.setHeader("Content-Disposition", "attachment; filename=\"questions.txt\"");
    res.send(content);
  } catch (err) {
    console.error("Export questions error:", err.message);
    res.status(500).send("Failed to export questions");
  }
});

// Get all scores sorted desc
app.get("/scores", async (req, res) => {
  try {
    const scores = await Score.find().sort({ score: -1 });
    res.json(scores);
  } catch (err) {
    res.status(500).json({ error: "Failed to load scores" });
  }
});

// Edit a user score
app.put("/scores/:id", async (req, res) => {
  try {
    const { score } = req.body;
    const updated = await Score.findByIdAndUpdate(
      req.params.id,
      { score },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to update score" });
  }
});

// Delete a user
app.delete("/scores/:id", async (req, res) => {
  try {
    await Score.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete score" });
  }
});



const PORT = process.env.PORT || 3002;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
