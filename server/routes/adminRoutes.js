const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const auth = require("../middlewares/authMiddleware");

router.post("/login", adminController.login);

// create admin (protected)
router.post("/create", auth, adminController.createAdmin);

module.exports = router;
