const express = require("express");
const router = express.Router();

const analyticsController = require("../controllers/analyticsController");
const auth = require("../middlewares/authMiddleware");

/* ===========================
   PUBLIC ROUTES
   =========================== */

// Track user action (view, save, complete)
router.post("/track", analyticsController.trackAction);

// Get dashboard stats (public for now, can be restricted to admin later)
router.get("/dashboard", analyticsController.getDashboardStats);

/* ===========================
   ADMIN ROUTES
   =========================== */

// Get detailed analytics stats (admin only)
router.get("/stats", auth, analyticsController.getStats);

module.exports = router;
