const express = require("express");

const {
  createCommunication,
  getCommunications,
  getCommunicationById,
  getMyCommunications,
  updateCommunication,
  deleteCommunication,
} = require("../controllers/communicationController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();


// ========================================
// COMMUNICATION ROUTES
// ========================================


// Create communication
router.post(
  "/",
  createCommunication
);


// Get all communications
router.get(
  "/",
  getCommunications
);


// ========================================
// GET MY COMMUNICATIONS (SELF-SCOPED)
// Must stay BEFORE "/:id" - otherwise Express
// will treat "me" as an :id param.
// ========================================

router.get(
  "/me",
  protect,
  getMyCommunications
);


// Get single communication
router.get(
  "/:id",
  getCommunicationById
);


// Update communication
router.patch(
  "/:id",
  updateCommunication
);


// Delete communication
router.delete(
  "/:id",
  deleteCommunication
);


module.exports = router;