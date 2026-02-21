const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure directories exist
const dirs = ["uploads/thumbnails", "uploads/videos", "uploads/pdfs"];
dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "thumbnail") {
      cb(null, "uploads/thumbnails");
    } else if (file.fieldname === "video") {
      cb(null, "uploads/videos");
    } else if (file.fieldname === "pdf") {
      cb(null, "uploads/pdfs");
    } else {
      cb(null, "uploads");
    }
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueName + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const videoExt = [".mp4", ".mov", ".avi", ".mkv"];
  const imageExt = [".jpg", ".jpeg", ".png", ".webp"];
  const pdfExt = [".pdf"];
  const ext = path.extname(file.originalname).toLowerCase();

  if (file.fieldname === "video" && videoExt.includes(ext)) {
    cb(null, true);
  } else if (file.fieldname === "thumbnail" && imageExt.includes(ext)) {
    cb(null, true);
  } else if (file.fieldname === "pdf" && pdfExt.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type for ${file.fieldname}`));
  }
};

module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: 200 * 1024 * 1024 },
});
