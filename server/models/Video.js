const mongoose = require("mongoose");

const videoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },

  description: String,

  blogContent: String,   // optional article/blog content (fetched from PDF or entered manually)

  videoPath: String,
  thumbnailPath: String, // Cover image for both video and blog
  
  type: {
    type: String,
    enum: ["VIDEO", "BLOG"],
    default: "VIDEO"
  },

  category: {
    type: String,
    enum: [
      "EMOTIONAL", 
      "TECHNOLOGY", 
      "SCIENCE", 
      "PERSONAL FINANCE", 
      "INFORMATIONAL BRIEFING", 
      "NEWS",
      "TECH INFO"
    ],
    default: "INFORMATIONAL BRIEFING"
  },

  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Video", videoSchema);
