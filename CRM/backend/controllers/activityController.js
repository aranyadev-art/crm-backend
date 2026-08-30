const Activity = require("../models/Activity");

// =========================
// GET ALL ACTIVITIES (paginated, filterable)
// =========================

const getAllActivities = async (req, res) => {
  try {
    const {
      module,
      action,
      user,
      performedBy,
      page = 1,
      limit = 20,
    } = req.query;

    const query = {};

    if (module) query.module = module;
    if (action) query.action = action;
    if (user) query.user = user;
    if (performedBy) query.performedBy = performedBy;

    const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
    const limitNumber = Math.max(parseInt(limit, 10) || 20, 1);
    const skip = (pageNumber - 1) * limitNumber;

    const [activities, total] = await Promise.all([
      Activity.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber)
        .populate("user", "fullName")
        .populate("performedBy", "fullName"),

      Activity.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: activities,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        pages: Math.ceil(total / limitNumber),
      },
    });
  } catch (error) {
    console.error("Get activities error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch activities",
      error: error.message,
    });
  }
};

// =========================
// GET SINGLE ACTIVITY
// =========================

const getActivityById = async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id)
      .populate("user", "fullName")
      .populate("performedBy", "fullName");

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: "Activity not found",
      });
    }

    res.status(200).json({
      success: true,
      data: activity,
    });
  } catch (error) {
    console.error("Get activity error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch activity",
      error: error.message,
    });
  }
};

// =========================
// GET ACTIVITIES BY USER
// =========================

const getActivitiesByUser = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
    const limitNumber = Math.max(parseInt(limit, 10) || 20, 1);
    const skip = (pageNumber - 1) * limitNumber;

    const query = { user: req.params.userId };

    const [activities, total] = await Promise.all([
      Activity.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber)
        .populate("performedBy", "fullName"),

      Activity.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: activities,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        pages: Math.ceil(total / limitNumber),
      },
    });
  } catch (error) {
    console.error("Get user activities error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch user's activities",
      error: error.message,
    });
  }
};

module.exports = {
  getAllActivities,
  getActivityById,
  getActivitiesByUser,
};