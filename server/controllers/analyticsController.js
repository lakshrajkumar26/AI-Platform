const Video = require("../models/Video");
const UserActivity = require("../models/UserActivity");

// ================= TRACK ACTION =================
exports.trackAction = async (req, res) => {
  try {
    const { contentId, action, userId, metadata } = req.body;

    if (!contentId || !action || !userId) {
      return res.status(400).json({ error: "Missing required fields: contentId, action, userId" });
    }

    if (!["VIEW", "SAVE", "COMPLETE", "PROGRESS", "LIKE"].includes(action)) {
      return res.status(400).json({ error: "Invalid action type" });
    }

    // Check if video exists
    const video = await Video.findById(contentId);
    if (!video) {
      return res.status(404).json({ error: "Video not found" });
    }

    // Log the activity
    const activity = new UserActivity({
      userId,
      contentId,
      action,
      metadata: metadata || {},
    });
    await activity.save();

    // Update video counters
    if (action === "VIEW") {
      video.views = (video.views || 0) + 1;
    } else if (action === "SAVE") {
      video.saves = (video.saves || 0) + 1;
    } else if (action === "LIKE") {
      video.likes = (video.likes || 0) + 1;
    } else if (action === "COMPLETE") {
      video.completions = (video.completions || 0) + 1;
    }

    await video.save();

    res.json({
      success: true,
      message: `${action} tracked successfully`,
      activity,
    });
  } catch (err) {
    console.error("Track action error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ================= GET ANALYTICS STATS =================
exports.getStats = async (req, res) => {
  try {
    // Total counts
    const totalVideos = await Video.countDocuments({ type: "VIDEO" });
    const totalBlogs = await Video.countDocuments({ type: "BLOG" });

    // Most viewed videos
    const mostViewedVideos = await Video.find({ type: "VIDEO" })
      .sort({ views: -1 })
      .limit(5)
      .select("title views category");

    // Most saved blogs
    const mostSavedBlogs = await Video.find({ type: "BLOG" })
      .sort({ saves: -1 })
      .limit(5)
      .select("title saves category");

    // Active users today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const activeUsersToday = await UserActivity.distinct("userId", {
      timestamp: { $gte: today, $lt: tomorrow },
    });

    // Overall stats
    const totalViews = await UserActivity.countDocuments({ action: "VIEW" });
    const totalSaves = await UserActivity.countDocuments({ action: "SAVE" });
    const totalLikes = await UserActivity.countDocuments({ action: "LIKE" });
    const totalCompletions = await UserActivity.countDocuments({ action: "COMPLETE" });

    // Completion rate (videos completed / videos viewed)
    const completionRate = totalViews > 0 ? ((totalCompletions / totalViews) * 100).toFixed(2) : 0;

    // Most viewed video overall
    const mostViewedVideoOverall = await Video.findOne({ type: "VIDEO" })
      .sort({ views: -1 })
      .select("title views");

    // Most saved blog overall
    const mostSavedBlogOverall = await Video.findOne({ type: "BLOG" })
      .sort({ saves: -1 })
      .select("title saves");

    // Activity trend (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const activityTrend = await UserActivity.aggregate([
      {
        $match: {
          timestamp: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$timestamp" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Category breakdown
    const categoryBreakdown = await Video.aggregate([
      {
        $group: {
          _id: "$category",
          videoCount: {
            $sum: {
              $cond: [{ $eq: ["$type", "VIDEO"] }, 1, 0],
            },
          },
          blogCount: {
            $sum: {
              $cond: [{ $eq: ["$type", "BLOG"] }, 1, 0],
            },
          },
          totalViews: { $sum: "$views" },
          totalSaves: { $sum: "$saves" },
        },
      },
      {
        $sort: { totalViews: -1 },
      },
    ]);

    // Construct the dashboard response
    res.json({
      totalVideos,
      totalBlogs,
      activeUsersToday: activeUsersToday.length,
      mostWatchedVideo: mostViewedVideoOverall || { title: "N/A", views: 0 },
      mostSavedBlog: mostSavedBlogOverall || { title: "N/A", saves: 0 },
      completionRate: parseFloat(completionRate),
      totalViews,
      totalSaves,
      totalLikes,
      totalCompletions,
      summary: {
        totalVideos,
        totalBlogs,
        activeUsersToday: activeUsersToday.length,
        totalViews,
        totalSaves,
        totalLikes,
        totalCompletions,
        completionRate: parseFloat(completionRate),
      },
      topContent: {
        mostViewedVideos,
        mostSavedBlogs,
        mostViewedVideoOverall,
        mostSavedBlogOverall,
      },
      trends: {
        activityTrend,
        categoryBreakdown,
      },
    });
  } catch (err) {
    console.error("Get stats error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ================= GET USER PROGRESS =================
exports.getUserProgress = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    // Find all PROGRESS activities for this user
    // We want the latest progress for each contentId
    const progressItems = await UserActivity.aggregate([
      { $match: { userId, action: "PROGRESS" } },
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id: "$contentId",
          latestProgress: { $first: "$$ROOT" },
        },
      },
      {
        $lookup: {
          from: "videos",
          localField: "_id",
          foreignField: "_id",
          as: "content",
        },
      },
      { $unwind: "$content" },
      {
        $project: {
          _id: 0,
          contentId: "$_id",
          progress: "$latestProgress.metadata.progress",
          timestamp: "$latestProgress.timestamp",
          content: 1,
        },
      },
      { $sort: { timestamp: -1 } },
    ]);

    // Filter out completed items (if they have a COMPLETE action later than the latest PROGRESS)
    // Or if progress is 100%
    const filteredProgress = [];
    for (const item of progressItems) {
      if (item.progress >= 100) continue;

      const completion = await UserActivity.findOne({
        userId,
        contentId: item.contentId,
        action: "COMPLETE",
        timestamp: { $gt: item.timestamp },
      });

      if (!completion) {
        filteredProgress.push(item);
      }
    }

    res.json(filteredProgress);
  } catch (err) {
    console.error("Get user progress error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ================= GET DETAILED STATS FOR DASHBOARD =================
exports.getDashboardStats = async (req, res) => {
  try {
    // Get all the stats we need for the dashboard
    const totalVideos = await Video.countDocuments({ type: "VIDEO" });
    const totalBlogs = await Video.countDocuments({ type: "BLOG" });

    // Active users today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const activeUsersToday = await UserActivity.distinct("userId", {
      timestamp: { $gte: today, $lt: tomorrow },
    });

    // Most watched video
    const mostWatchedVideo = await Video.findOne({ type: "VIDEO" })
      .sort({ views: -1 })
      .select("title views");

    // Most saved blog
    const mostSavedBlog = await Video.findOne({ type: "BLOG" })
      .sort({ saves: -1 })
      .select("title saves");

    // Overall completion rate
    const totalViews = await UserActivity.countDocuments({ action: "VIEW" });
    const totalCompletions = await UserActivity.countDocuments({ action: "COMPLETE" });
    const completionRate = totalViews > 0 ? ((totalCompletions / totalViews) * 100).toFixed(2) : 0;

    // Total saves and likes
    const totalSaves = await UserActivity.countDocuments({ action: "SAVE" });
    const totalLikes = await UserActivity.countDocuments({ action: "LIKE" });

    res.json({
      totalVideos,
      totalBlogs,
      activeUsersToday: activeUsersToday.length,
      mostWatchedVideo: mostWatchedVideo || { title: "N/A", views: 0 },
      mostSavedBlog: mostSavedBlog || { title: "N/A", saves: 0 },
      completionRate: parseFloat(completionRate),
      totalViews,
      totalSaves,
      totalLikes,
      totalCompletions,
    });
  } catch (err) {
    console.error("Get dashboard stats error:", err);
    res.status(500).json({ error: err.message });
  }
};
