// backend/controllers/reportController.js

const {
  getOverviewMetrics,
  getConversionFunnel,
} = require("../services/reportService");

// ========================================
// GET OVERVIEW REPORT
// ========================================

const getOverview = async (req, res) => {
  try {

    const { range, startDate, endDate } = req.query;

    const metrics = await getOverviewMetrics({
      range,
      startDate,
      endDate,
    });

    res.status(200).json({
      success: true,
      data: metrics,
    });

  } catch (error) {

    console.error("Get overview report error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch overview report",
      error: error.message,
    });
  }
};

// ========================================
// GET CONVERSION FUNNEL
// ========================================
// GET /api/reports/funnel?range=thisMonth

const getFunnel = async (req, res) => {
  try {

    const { range, startDate, endDate } = req.query;

    const funnel = await getConversionFunnel({
      range,
      startDate,
      endDate,
    });

    res.status(200).json({
      success: true,
      data: funnel,
    });

  } catch (error) {

    console.error("Get conversion funnel error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch conversion funnel",
      error: error.message,
    });
  }
};

module.exports = {
  getOverview,
  getFunnel,
};