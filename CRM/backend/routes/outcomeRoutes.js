// backend/routes/outcomeRoutes.js

const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");

const {
  createOutcome,
  getOutcomes,
  getOutcomeById,
  getMyOutcomes,
  updateOutcome,
  deleteOutcome,
} = require("../controllers/outcomeController");

// ========================================
// ROUTES
// ========================================

router.post("/", createOutcome);
router.get("/", getOutcomes);

// ========================================
// GET MY OUTCOMES (SELF-SCOPED)
// Must stay BEFORE "/:id" - otherwise Express
// will treat "me" as an :id param.
// ========================================

router.get("/me", protect, getMyOutcomes);

router.get("/:id", getOutcomeById);
router.patch("/:id", updateOutcome);
router.delete("/:id", deleteOutcome);

module.exports = router;