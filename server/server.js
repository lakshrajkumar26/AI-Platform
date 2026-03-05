const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const Admin = require("./models/Admin");

const adminRoutes = require("./routes/adminRoutes");
const videoRoutes = require("./routes/videoRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");

const app = express();

// MIDDLEWARE
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS Configuration - Allow frontend to communicate with backend
app.use(cors({
  origin: [
    "http://localhost:5173",  // Vite dev server
    "http://localhost:3000",  // Alternative dev port
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
    process.env.FRONTEND_URL || "http://localhost:5173"
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Static file serving for uploads
app.use("/uploads", express.static("uploads"));

// CONNECT DB
mongoose.connect("mongodb://127.0.0.1:27017/videoApp")
  .then(async () => {
    console.log("✅ MongoDB Connected");

    // ✅ create default admin if none exists
    const adminExists = await Admin.findOne({ username: "admin" });

    if (!adminExists) {
      const hashedPassword = await bcrypt.hash("laksh", 10);

      await Admin.create({
        username: "admin",
        password: hashedPassword,
      });

      console.log("✅ Default admin created");
      console.log("👉 username: admin");
      console.log("👉 password: laksh");
    } else {
      console.log("✅ Default admin already exists");
    }
  })
  .catch(err => {
    console.error("❌ MongoDB Connection Error:", err);
    process.exit(1);
  });

// ROUTES
app.use("/admin", adminRoutes);
app.use("/videos", videoRoutes);
app.use("/analytics", analyticsRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "Server is running", timestamp: new Date() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server Error:", err);
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
    timestamp: new Date()
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📺 API Base URL: http://localhost:${PORT}`);
});
