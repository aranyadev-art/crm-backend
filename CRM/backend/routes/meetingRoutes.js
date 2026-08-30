const express = require("express");

const router = express.Router();

const { protect } = require("../middleware/authMiddleware");

const {
  createMeeting,
  getMeetings,
  getMeetingById,
  getMeetingsByShortlist,
  getMyMeetings,
  updateMeetingStatus,
  archiveMeeting,
} = require("../controllers/meetingController");

// ========================================
// MEETING ROUTES
// ========================================

router.post("/", createMeeting);

router.get("/", getMeetings);

router.get(
  "/shortlist/:shortlistId",
  getMeetingsByShortlist
);

// ========================================
// GET MY MEETINGS (SELF-SCOPED)
// Must stay BEFORE "/:id" - otherwise Express
// will treat "me" as an :id param.
// ========================================

router.get("/me", protect, getMyMeetings);

router.get("/:id", getMeetingById);

router.patch(
  "/:id/status",
  updateMeetingStatus
);

router.patch(
  "/:id/archive",
  archiveMeeting
);

module.exports = router;