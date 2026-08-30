const express = require("express");

const {
  createShortlist,
  getShortlists,
  getShortlistById,
  updateShortlistStatus,
  updateShortlistNote,
  archiveShortlist,
  getUserShortlistHistory,
  getMyShortlist,
} = require("../controllers/shortlistController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();


// ========================================
// MY SHORTLIST (matrimonial user — self only)
// ========================================
// IMPORTANT: /:id route se PEHLE, warna Express "me" ko
// :id ki tarah treat kar lega.

router.get("/me", protect, getMyShortlist);


// ========================================
// SHORTLIST ROUTES
// ========================================

// Create shortlist
router.post("/", createShortlist);

// Get all shortlists
router.get("/", getShortlists);

// Get shortlist history for a specific user
router.get(
  "/user/:userId",
  getUserShortlistHistory
);

// Get single shortlist
router.get("/:id", getShortlistById);

// Update shortlist status
router.patch(
  "/:id/status",
  updateShortlistStatus
);

// Update shortlist note
router.patch(
  "/:id/note",
  updateShortlistNote
);

// Archive shortlist
router.patch(
  "/:id/archive",
  archiveShortlist
);

module.exports = router;