// backend/models/Outcome.js

const mongoose = require("mongoose");

const outcomeSchema = new mongoose.Schema(
  {
    // ========================================
    // USERS
    // ========================================

    userA: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User A is required"],
    },

    userB: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User B is required"],
    },

    // ========================================
    // RELATED RECORDS
    // ========================================

    shortlist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shortlist",
      default: null,
    },

    meetings: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Meeting",
      },
    ],

    // ========================================
    // FINAL STATUS
    // ========================================

    status: {
      type: String,
      enum: [
        "IN_PROGRESS",
        "MARRIED",
        "ENGAGED",
        "REJECTED_BY_MALE",
        "REJECTED_BY_FEMALE",
        "REJECTED_BY_BOTH",
        "CANCELLED",
      ],
      default: "IN_PROGRESS",
      required: true,
    },

    // ========================================
    // OUTCOME DETAILS
    // ========================================

    outcomeDate: {
      type: Date,
      default: null,
    },

    reason: {
      type: String,
      trim: true,
      default: "",
    },

    assignedStaff: {
      type: String,
      trim: true,
      default: "",
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

    // ========================================
    // ARCHIVE
    // ========================================

    archived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// ========================================
// INDEXES
// ========================================

outcomeSchema.index({ userA: 1 });
outcomeSchema.index({ userB: 1 });
outcomeSchema.index({ shortlist: 1 });
outcomeSchema.index({ status: 1 });
outcomeSchema.index({ archived: 1 });

// ========================================
// VALIDATION — userA and userB must differ
// ========================================

outcomeSchema.pre("validate", function () {
  if (
    this.userA &&
    this.userB &&
    this.userA.toString() === this.userB.toString()
  ) {
    throw new Error("User A and User B cannot be the same user");
  }
});

const Outcome = mongoose.model("Outcome", outcomeSchema);

module.exports = Outcome;