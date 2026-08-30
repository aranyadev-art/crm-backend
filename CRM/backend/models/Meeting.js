const mongoose = require("mongoose");

const meetingSchema = new mongoose.Schema(
  {
    // ========================================
    // SHORTLIST
    // ========================================

    shortlist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shortlist",
      required: [true, "Shortlist is required"],
    },

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
    // MEETING DATE & TIME
    // ========================================

    meetingDate: {
      type: Date,
      required: [true, "Meeting date is required"],
    },

    // ========================================
    // MEETING TYPE
    // ========================================

    type: {
      type: String,
      enum: [
        "IN_PERSON",
        "VIDEO_CALL",
        "PHONE_CALL",
      ],
      default: "IN_PERSON",
      required: true,
    },

    // ========================================
    // LOCATION
    // ========================================

    location: {
      type: String,
      trim: true,
      default: "",
    },

    // ========================================
    // STATUS
    // ========================================

    status: {
      type: String,
      enum: [
        "SCHEDULED",
        "COMPLETED",
        "CANCELLED",
        "RESCHEDULED",
        "NO_SHOW",
      ],
      default: "SCHEDULED",
      required: true,
    },

    // ========================================
    // NOTES
    // ========================================

    notes: {
      type: String,
      trim: true,
      default: "",
    },

    // ========================================
    // MEETING RESULT
    // ========================================

    result: {
      type: String,
      enum: [
        "POSITIVE",
        "NEGATIVE",
        "NEUTRAL",
        "PENDING",
      ],
      default: "PENDING",
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

meetingSchema.index({
  shortlist: 1,
});

meetingSchema.index({
  userA: 1,
});

meetingSchema.index({
  userB: 1,
});

meetingSchema.index({
  meetingDate: 1,
});

meetingSchema.index({
  status: 1,
});

meetingSchema.index({
  archived: 1,
});


// ========================================
// MODEL
// ========================================

const Meeting = mongoose.model(
  "Meeting",
  meetingSchema
);

module.exports = Meeting;