const express = require("express");
const router = express.Router();

const { getDashboardStats } = require("../controllers/dashboardController");

// =========================
// DASHBOARD ROUTES
// =========================

router.get("/stats", getDashboardStats);

module.exports = router;