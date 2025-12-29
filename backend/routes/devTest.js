const express = require("express");
const Question = require("../models/Question");
const router = express.Router();

// POST /api/dev/seed-question
router.post("/seed-question", async (req, res) => {
  try {
    const q = await Question.create({
      questionText: "What is 2 + 2?",
      answerText: "4",
    });
    res.json(q);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to seed question" });
  }
});

// GET /api/dev/questions
router.get("/questions", async (req, res) => {
  try {
    const questions = await Question.find().limit(10);
    res.json(questions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load questions" });
  }
});

module.exports = router;
