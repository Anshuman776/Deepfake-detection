const mongoose = require("mongoose");

const scanSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    fileUrl: {
      type: String,
      required: true,
    },

    type: {
      type: String,
      enum: ["image", "video", "audio"],
      required: true,
    },

    aiProbability: {
      type: Number,
      required: true,
    },

    verdict: {
      type: String,
      enum: ["Likely AI Generated", "Likely Human"],
    },

    reportUrl: {
      type: String,
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Scan", scanSchema);