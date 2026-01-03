// backend/models/Settings.js
const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    userName: { type: String, required: true },
    password: { type: String, required: true }, // simple demo, not secure
    liveChatId: String,
    youtubeHostName: String,
    questionDelayMs: Number,
    defaultMessage: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Settings", settingsSchema);
