require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const Score = require("./models/Score");
const Question = require("./models/Question");
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
// Later we’ll mount routes here, like:
// app.use("/api/questions", require("./routes/questions"));

// after app.use(express.json())
app.use("/dev", require("./routes/devTest"));


const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));


