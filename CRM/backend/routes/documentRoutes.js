const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");

const {
  createDocument,
  uploadMyDocument,
  getAllDocuments,
  getDocumentById,
  getDocumentsByUser,
  getMyDocuments,
  updateDocumentStatus,
  archiveDocument,
} = require("../controllers/documentController");

const documentUpload = require("../middleware/documentUpload");

// =========================
// MULTER ERROR-HANDLING WRAPPER
// =========================

const handleUpload = (req, res, next) => {
  const uploader = documentUpload.single("file");

  uploader(req, res, (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          message: "File is too large. Maximum size is 5MB.",
        });
      }

      return res.status(400).json({
        success: false,
        message: err.message || "File upload failed",
      });
    }

    next();
  });
};

// =========================
// DOCUMENT ROUTES
// =========================

router.post("/", handleUpload, createDocument);

router.get("/", getAllDocuments);

router.get("/user/:userId", getDocumentsByUser);

// =========================
// MY DOCUMENTS ROUTES (SELF-SCOPED)
// Must stay BEFORE "/:id" - otherwise Express
// will treat "me" as an :id param.
// =========================

router.post("/me", protect, handleUpload, uploadMyDocument);

router.get("/me", protect, getMyDocuments);

router.get("/:id", getDocumentById);

router.patch("/:id/status", updateDocumentStatus);

router.patch("/:id/archive", archiveDocument);

module.exports = router;