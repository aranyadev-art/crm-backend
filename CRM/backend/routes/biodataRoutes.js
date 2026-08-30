const express = require("express");

const {
  createBiodata,
  getBiodatas,
  getBiodataById,
  getBiodataByUser,
  updateBiodata,
  generateBiodata,
  downloadBiodataPdf,
  shareBiodata,
  archiveBiodata,
} = require("../controllers/biodataController");

const router = express.Router();


// ========================================
// BIODATA ROUTES
// ========================================

// Create biodata
router.post(
  "/",
  createBiodata
);


// Get all biodatas
router.get(
  "/",
  getBiodatas
);


// Get biodata by user
router.get(
  "/user/:userId",
  getBiodataByUser
);


// Get single biodata
router.get(
  "/:id",
  getBiodataById
);


// Update biodata
router.patch(
  "/:id",
  updateBiodata
);


// Generate biodata
router.patch(
  "/:id/generate",
  generateBiodata
);


// Download biodata PDF
router.get(
  "/:id/download",
  downloadBiodataPdf
);


// Share biodata
router.patch(
  "/:id/share",
  shareBiodata
);


// Archive biodata
router.patch(
  "/:id/archive",
  archiveBiodata
);


module.exports = router;