const express = require("express");
const router = express.Router();

const {
  createTask,
  getAllTasks,
  getTaskById,
  getTasksByUser,
  updateTask,
  updateTaskStatus,
  archiveTask,
} = require("../controllers/taskController");

// =========================
// TASK ROUTES
// =========================

router.post("/", createTask);

router.get("/", getAllTasks);

router.get("/user/:userId", getTasksByUser);

router.get("/:id", getTaskById);

router.patch("/:id", updateTask);

router.patch("/:id/status", updateTaskStatus);

router.patch("/:id/archive", archiveTask);

module.exports = router;