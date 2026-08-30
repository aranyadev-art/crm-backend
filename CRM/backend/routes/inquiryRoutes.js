const express = require("express");
const router = express.Router();

const {
  createInquiry,
  getAllInquiries,
  getInquiryById,
  updateInquiry,
  archiveInquiry,
  convertToUser,
} = require("../controllers/inquiryController");

// =========================
// INQUIRY ROUTES
// =========================

router.post("/", createInquiry);

router.get("/", getAllInquiries);

router.get("/:id", getInquiryById);

router.put("/:id", updateInquiry);

router.patch("/:id/archive", archiveInquiry);

router.patch("/:id/convert", convertToUser);

module.exports = router;