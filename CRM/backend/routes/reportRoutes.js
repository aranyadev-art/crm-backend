// backend/routes/reportRoutes.js

const express = require("express");
const router = express.Router();

const {
  getOverview,
  getFunnel,
} = require("../controllers/reportController");

// ========================================
// GET /api/reports/overview
// ========================================

router.get("/overview", getOverview);

// ========================================
// GET /api/reports/funnel
// ========================================

router.get("/funnel", getFunnel);

module.exports = router;