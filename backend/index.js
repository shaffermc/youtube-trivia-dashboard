require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

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

// Later we’ll mount routes here, like:
// app.use("/api/questions", require("./routes/questions"));

// after app.use(express.json())
app.use("/api/dev", require("./routes/devTest"));


const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
