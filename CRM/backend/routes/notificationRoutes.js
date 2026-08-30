const express = require("express");
const router = express.Router();

const { getRecentNotifications } = require("../controllers/notificationController");

// =========================
// NOTIFICATION ROUTES
// =========================

router.get("/recent", getRecentNotifications);

module.exports = router;