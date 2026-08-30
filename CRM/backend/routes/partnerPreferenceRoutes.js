const express = require("express");

const {
  createPartnerPreference,
  getPartnerPreferences,
  updatePartnerPreference,
  deletePartnerPreference,
  getMyPreference,
  saveMyPreference,
} = require("../controllers/partnerPreferenceController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();


// ========================================
// MY PARTNER PREFERENCE (matrimonial user — self only)
// ========================================
// IMPORTANT: /:id route se PEHLE, warna Express "me" ko
// :id ki tarah treat kar lega.

router.get("/me", protect, getMyPreference);
router.put("/me", protect, saveMyPreference);


// ========================================
// GET ALL PARTNER PREFERENCES
// ========================================

router.get("/", getPartnerPreferences);


// ========================================
// CREATE PARTNER PREFERENCE
// ========================================

router.post("/", createPartnerPreference);


// ========================================
// UPDATE PARTNER PREFERENCE
// ========================================

router.put("/:id", updatePartnerPreference);


// ========================================
// DELETE PARTNER PREFERENCE
// ========================================

router.delete("/:id", deletePartnerPreference);


module.exports = router;