const Task = require("../models/Task");
const User = require("../models/User");
const { logActivity } = require("../services/activityService");

// =========================
// HELPER: Add isOverdue flag
// =========================

const withOverdueFlag = (task) => {
  const taskObj = task.toObject ? task.toObject() : task;

  const isOverdue =
    !!taskObj.dueDate &&
    new Date(taskObj.dueDate) < new Date() &&
    !["COMPLETED", "CANCELLED"].includes(taskObj.status);

  return { ...taskObj, isOverdue };
};

// =========================
// CREATE TASK
// =========================

const createTask = async (req, res) => {
  try {
    const { title, user } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Title is required",
      });
    }

    if (user) {
      const existingUser = await User.findById(user);

      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }
    }

    const task = await Task.create(req.body);
        logActivity({
      action: "CREATED",
      module: "TASK",
      targetType: "Task",
      targetId: task._id,
      description: `Task "${task.title}" was created`,
      user: task.user || null,
      metadata: { priority: task.priority },
    });

    const populatedTask = await task.populate("user", "fullName contactNo");

    res.status(201).json({
      success: true,
      message: "Task created successfully",
      data: withOverdueFlag(populatedTask),
    });
  } catch (error) {
    console.error("Create task error:", error.message);

    res.status(400).json({
      success: false,
      message: error.message || "Failed to create task",
    });
  }
};

// =========================
// GET ALL TASKS (with filters)
// =========================

const getAllTasks = async (req, res) => {
  try {
    const { status, priority, user, assignedTo, search } = req.query;

    const query = { archived: false };

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (user) query.user = user;
    if (assignedTo) query.assignedTo = assignedTo;

    if (search) {
      query.title = { $regex: search, $options: "i" };
    }

    const tasks = await Task.find(query)
      .sort({ dueDate: 1, createdAt: -1 })
      .populate("user", "fullName contactNo");

    const tasksWithOverdue = tasks.map((task) => withOverdueFlag(task));

    res.status(200).json({
      success: true,
      count: tasksWithOverdue.length,
      data: tasksWithOverdue,
    });
  } catch (error) {
    console.error("Get tasks error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch tasks",
      error: error.message,
    });
  }
};

// =========================
// GET SINGLE TASK
// =========================

const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate("user", "fullName contactNo city")
      .populate("shortlist")
      .populate("communication")
      .populate("meeting")
      .populate("outcome")
      .populate("document");

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    res.status(200).json({
      success: true,
      data: withOverdueFlag(task),
    });
  } catch (error) {
    console.error("Get task error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch task",
      error: error.message,
    });
  }
};

// =========================
// GET TASKS BY USER
// =========================

const getTasksByUser = async (req, res) => {
  try {
    const tasks = await Task.find({
      user: req.params.userId,
      archived: false,
    }).sort({ dueDate: 1, createdAt: -1 });

    const tasksWithOverdue = tasks.map((task) => withOverdueFlag(task));

    res.status(200).json({
      success: true,
      count: tasksWithOverdue.length,
      data: tasksWithOverdue,
    });
  } catch (error) {
    console.error("Get user tasks error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch user's tasks",
      error: error.message,
    });
  }
};

// =========================
// UPDATE TASK (general edit)
// =========================

const updateTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("user", "fullName contactNo");

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Task updated successfully",
      data: withOverdueFlag(task),
    });
  } catch (error) {
    console.error("Update task error:", error.message);

    res.status(400).json({
      success: false,
      message: error.message || "Failed to update task",
    });
  }
};

// =========================
// UPDATE TASK STATUS
// =========================

const updateTaskStatus = async (req, res) => {
  try {
    const { status, completedBy } = req.body;

    if (!["TODO", "IN_PROGRESS", "COMPLETED", "CANCELLED"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value",
      });
    }

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    task.status = status;

    if (status === "COMPLETED") {
      task.completedAt = new Date();
      task.completedBy = completedBy || "";
    } else {
      task.completedAt = null;
      task.completedBy = "";
    }

    await task.save();

        if (status === "COMPLETED" || status === "CANCELLED") {
      logActivity({
        action: status,
        module: "TASK",
        targetType: "Task",
        targetId: task._id,
        description:
          status === "COMPLETED"
            ? `Task "${task.title}" was completed`
            : `Task "${task.title}" was cancelled`,
        user: task.user || null,
      });
    }

    const populatedTask = await task.populate("user", "fullName contactNo");

    res.status(200).json({
      success: true,
      message: `Task marked as ${status}`,
      data: withOverdueFlag(populatedTask),
    });
  } catch (error) {
    console.error("Update task status error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to update task status",
      error: error.message,
    });
  }
};

// =========================
// ARCHIVE TASK
// =========================

const archiveTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { archived: true },
      { new: true }
    );

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Task archived successfully",
      data: task,
    });
  } catch (error) {
    console.error("Archive task error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to archive task",
      error: error.message,
    });
  }
};

module.exports = {
  createTask,
  getAllTasks,
  getTaskById,
  getTasksByUser,
  updateTask,
  updateTaskStatus,
  archiveTask,
};