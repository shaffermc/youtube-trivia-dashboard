const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    questionText: {
      type: String,
      required: true,
      trim: true,
    },
    answerText: {
      type: String,
      required: true,
      trim: true,
    },
    ownerUserName: {
      type: String,
      required: true,
      trim: true,
    },
    // Optional extras for future:
    createdBy: {
      type: String,
      default: "system",
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  {
    timestamps: true, // adds createdAt, updatedAt
  }
);

module.exports = mongoose.model("Question", questionSchema);
