const express = require("express");
const router = express.Router();

const videoController = require("../controllers/videoController");
const auth = require("../middlewares/authMiddleware");
const upload = require("../middlewares/videoUploaderMiddleware");

/* ===========================
   PUBLIC ROUTES
   =========================== */

// Get all content (videos and blogs)
router.get("/", videoController.getVideos);

// Get single content by ID
router.get("/:id", videoController.getSingleVideo);


/* ===========================
   ADMIN ROUTES
   =========================== */

// Upload new content (video/blog)
router.post(
  "/",
  auth,
  upload.fields([
    { name: "video", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
    { name: "pdf", maxCount: 1 },
  ]),
  videoController.uploadVideo
);

// Update content
router.put(
  "/:id",
  auth,
  upload.fields([
    { name: "video", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
    { name: "pdf", maxCount: 1 },
  ]),
  videoController.updateVideo
);

// Delete content
router.delete("/:id", auth, videoController.deleteVideo);

module.exports = router;
