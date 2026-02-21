const Video = require("../models/Video");
const fs = require("fs");
const path = require("path");
const { PDFParse } = require("pdf-parse");

// helper → convert \ to /
const normalizePath = (filePath) => {
  if (!filePath) return null;
  return filePath.replace(/\\/g, "/");
};

const extractPdfText = async (pdfPath) => {
  const dataBuffer = fs.readFileSync(pdfPath);
  const parser = new PDFParse({ data: dataBuffer });
  try {
    const result = await parser.getText();
    return result.text || "";
  } finally {
    await parser.destroy();
  }
};

// ================= UPLOAD =================
exports.uploadVideo = async (req, res) => {
  try {
    let blogContent = req.body.blogContent || "";
    const type = req.body.type || "VIDEO";
    const category = req.body.category || "INFORMATIONAL BRIEFING";

    // If PDF is uploaded, extract content
    if (req.files?.pdf) {
      const pdfPath = req.files.pdf[0].path;
      blogContent = await extractPdfText(pdfPath);
      
      // Optionally delete the PDF after extraction if not needed
      // fs.unlinkSync(pdfPath);
    }

    const video = new Video({
      title: req.body.title,
      description: req.body.description,
      blogContent: blogContent,
      type: type,
      category: category,

      videoPath: req.files?.video
        ? normalizePath(req.files.video[0].path)
        : null,

      thumbnailPath: req.files?.thumbnail
        ? normalizePath(req.files.thumbnail[0].path)
        : null,

      uploadedBy: req.adminId,
    });

    await video.save();
    res.status(201).json(video);
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ================= GET ALL (PUBLIC) =================
exports.getVideos = async (req, res) => {
  try {
    const { category, sort } = req.query;
    let query = {};
    
    if (category && category !== "All") {
      query.category = category;
    }

    let sortOption = { createdAt: -1 }; // Default: Latest
    if (sort === "oldest") {
      sortOption = { createdAt: 1 };
    } else if (sort === "date" && req.query.date) {
      const start = new Date(req.query.date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(req.query.date);
      end.setHours(23, 59, 59, 999);
      query.createdAt = { $gte: start, $lte: end };
    }

    const videos = await Video.find(query)
      .populate("uploadedBy", "username")
      .sort(sortOption);

    const baseUrl = `${req.protocol}://${req.get("host")}`;

    const fixedVideos = videos.map(v => ({
      ...v._doc,
      videoPath: v.videoPath
        ? `${baseUrl}/${normalizePath(v.videoPath)}`
        : null,
      thumbnailPath: v.thumbnailPath
        ? `${baseUrl}/${normalizePath(v.thumbnailPath)}`
        : null,
    }));

    res.json(fixedVideos);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ================= GET SINGLE =================
exports.getSingleVideo = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id)
      .populate("uploadedBy", "username")
      .lean();

    if (!video) {
      return res.status(404).json({ message: "Content not found" });
    }

    const baseUrl = `${req.protocol}://${req.get("host")}`;

    res.json({
      ...video,
      videoPath: video.videoPath
        ? `${baseUrl}/${normalizePath(video.videoPath)}`
        : null,
      thumbnailPath: video.thumbnailPath
        ? `${baseUrl}/${normalizePath(video.thumbnailPath)}`
        : null,
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ================= UPDATE =================
exports.updateVideo = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);

    if (!video) return res.status(404).json({ message: "Not found" });

    // update text fields
    if (req.body.title) video.title = req.body.title;
    if (req.body.description) video.description = req.body.description;
    if (req.body.type) video.type = req.body.type;
    if (req.body.category) video.category = req.body.category;

    if (req.files?.pdf) {
      const pdfPath = req.files.pdf[0].path;
      video.blogContent = await extractPdfText(pdfPath);
    } else if (req.body.blogContent !== undefined) {
      video.blogContent = req.body.blogContent;
    }

    // if new video uploaded → replace old file
    if (req.files?.video) {
      if (video.videoPath) {
        const absoluteVideoPath = path.join(__dirname, "..", video.videoPath);
        if (fs.existsSync(absoluteVideoPath)) {
          fs.unlinkSync(absoluteVideoPath);
        }
      }
      video.videoPath = normalizePath(req.files.video[0].path);
    }

    // if new thumbnail uploaded → replace old file
    if (req.files?.thumbnail) {
      if (video.thumbnailPath) {
        const absoluteThumbPath = path.join(__dirname, "..", video.thumbnailPath);
        if (fs.existsSync(absoluteThumbPath)) {
          fs.unlinkSync(absoluteThumbPath);
        }
      }
      video.thumbnailPath = normalizePath(req.files.thumbnail[0].path);
    }

    await video.save();
    res.json(video);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ================= DELETE =================
exports.deleteVideo = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);

    if (!video) return res.status(404).json({ message: "Not found" });

    // delete files from server
    if (video.videoPath) {
      const absoluteVideoPath = path.join(__dirname, "..", video.videoPath);
      if (fs.existsSync(absoluteVideoPath)) {
        fs.unlinkSync(absoluteVideoPath);
      }
    }

    if (video.thumbnailPath) {
      const absoluteThumbPath = path.join(__dirname, "..", video.thumbnailPath);
      if (fs.existsSync(absoluteThumbPath)) {
        fs.unlinkSync(absoluteThumbPath);
      }
    }

    await video.deleteOne();
    res.json({ message: "Deleted successfully" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
