const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    // =========================
    // WHAT HAPPENED
    // =========================

    action: {
      type: String,
      required: [true, "Action is required"],
      enum: [
        "CREATED",
        "UPDATED",
        "DELETED",
        "ARCHIVED",
        "STATUS_CHANGED",
        "UPLOADED",
        "VERIFIED",
        "REJECTED",
        "COMPLETED",
        "CANCELLED",
        "ASSIGNED",
      ],
    },

    module: {
      type: String,
      required: [true, "Module is required"],
      enum: [
        "USER",
        "INQUIRY",
        "SHORTLIST",
        "BIODATA",
        "COMMUNICATION",
        "MEETING",
        "OUTCOME",
        "DOCUMENT",
        "TASK",
        "MATCHING",
        "PARTNER_PREFERENCE",
      ],
    },

    // =========================
    // WHAT RECORD WAS AFFECTED
    // =========================

    targetType: {
      type: String,
      required: [true, "Target type is required"],
      trim: true,
    },

    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Target ID is required"],
    },

    // =========================
    // HUMAN-READABLE SUMMARY
    // =========================

    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },

    // =========================
    // OPTIONAL CONTEXT
    // =========================

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// =========================
// INDEXES
// =========================

activitySchema.index({ createdAt: -1 });
activitySchema.index({ module: 1 });
activitySchema.index({ action: 1 });
activitySchema.index({ user: 1 });
activitySchema.index({ performedBy: 1 });
activitySchema.index({ targetId: 1 });

const Activity = mongoose.model("Activity", activitySchema);

module.exports = Activity;