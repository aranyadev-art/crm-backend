const mongoose = require("mongoose");

const communicationSchema = new mongoose.Schema(
  {
    // ========================================
    // USER
    // ========================================

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },

    // ========================================
    // RELATED SHORTLIST
    // ========================================

    shortlist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shortlist",
      default: null,
    },

    // ========================================
    // RELATED BIODATA
    // ========================================

    biodata: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Biodata",
      default: null,
    },

    // ========================================
    // COMMUNICATION TYPE
    // ========================================

    type: {
      type: String,
      enum: [
        "CALL",
        "WHATSAPP",
        "EMAIL",
        "SMS",
        "OTHER",
      ],
      required: [true, "Communication type is required"],
    },

    // ========================================
    // DIRECTION
    // ========================================

    direction: {
      type: String,
      enum: [
        "OUTBOUND",
        "INBOUND",
      ],
      required: true,
    },

    // ========================================
    // STATUS
    // ========================================

    status: {
      type: String,
      enum: [
        "COMPLETED",
        "PENDING",
        "CANCELLED",
      ],
      default: "COMPLETED",
      required: true,
    },

    // ========================================
    // SUBJECT
    // ========================================

    subject: {
      type: String,
      trim: true,
    },

    // ========================================
    // NOTES
    // ========================================

    notes: {
      type: String,
      trim: true,
    },

    // ========================================
    // RESPONSE
    // ========================================

    response: {
      type: String,
      trim: true,
    },

    // ========================================
    // CONTACTED BY
    // ========================================

    contactedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // ========================================
    // FOLLOW-UP
    // ========================================

    followUpRequired: {
      type: Boolean,
      default: false,
    },

    nextFollowUpDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);


// ========================================
// INDEXES
// ========================================

communicationSchema.index({
  user: 1,
  createdAt: -1,
});

communicationSchema.index({
  nextFollowUpDate: 1,
});

communicationSchema.index({
  status: 1,
});

communicationSchema.index({
  type: 1,
});


const Communication = mongoose.model(
  "Communication",
  communicationSchema
);

module.exports = Communication;