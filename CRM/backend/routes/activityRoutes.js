const express = require("express");
const router = express.Router();

const {
  getAllActivities,
  getActivityById,
  getActivitiesByUser,
} = require("../controllers/activityController");

// =========================
// ACTIVITY ROUTES (read-only — no POST endpoint)
// =========================

router.get("/", getAllActivities);

router.get("/user/:userId", getActivitiesByUser);

router.get("/:id", getActivityById);

module.exports = router;