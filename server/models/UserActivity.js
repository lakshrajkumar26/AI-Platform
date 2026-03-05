const mongoose = require("mongoose");

const userActivitySchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    // Can be an anonymous ID or user identifier
  },

  contentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Video",
    required: true,
  },

  action: {
    type: String,
    enum: ["VIEW", "SAVE", "COMPLETE"],
    required: true,
  },

  timestamp: {
    type: Date,
    default: Date.now,
  },

  // Optional: store metadata about the action
  metadata: {
    duration: Number, // For video completion, how long they watched
    deviceType: String, // Desktop, Mobile, Tablet
  },
});

// Index for efficient queries
userActivitySchema.index({ contentId: 1, action: 1 });
userActivitySchema.index({ userId: 1, timestamp: -1 });
userActivitySchema.index({ timestamp: -1 });

module.exports = mongoose.model("UserActivity", userActivitySchema);
