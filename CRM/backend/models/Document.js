const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    // =========================
    // USER REFERENCE
    // =========================

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },

    // =========================
    // DOCUMENT TYPE
    // =========================

    type: {
      type: String,
      required: [true, "Document type is required"],
      enum: [
        "ID_PROOF",
        "ADDRESS_PROOF",
        "HOROSCOPE",
        "EDUCATION",
        "INCOME_PROOF",
        "PHOTOGRAPH",
        "OTHER",
      ],
    },

    // =========================
    // FILE INFO (from Cloudinary)
    // =========================

    fileUrl: {
      type: String,
      required: [true, "File URL is required"],
    },

    fileName: {
      type: String,
      trim: true,
    },

    fileType: {
      type: String,
      trim: true,
    },

    // =========================
    // STATUS / VERIFICATION
    // =========================

    status: {
      type: String,
      enum: ["PENDING", "VERIFIED", "REJECTED"],
      default: "PENDING",
    },

    remarks: {
      type: String,
      trim: true,
    },

    rejectionReason: {
      type: String,
      trim: true,
      default: "",
    },

    verifiedAt: {
      type: Date,
      default: null,
    },

    verifiedBy: {
      type: String,
      trim: true,
      default: "",
    },

    // =========================
    // ARCHIVE (soft-delete)
    // =========================

    archived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// =========================
// INDEXES
// =========================

documentSchema.index({ user: 1 });
documentSchema.index({ status: 1 });
documentSchema.index({ type: 1 });
documentSchema.index({ archived: 1 });

const Document = mongoose.model("Document", documentSchema);

module.exports = Document;