const mongoose = require("mongoose");

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true,
      enum: [
        "SHORTLISTED",
        "INTEREST_SENT",
        "INTEREST_RECEIVED",
        "MUTUAL_INTEREST",
        "BIODATA_SHARED",
        "MEETING_SCHEDULED",
        "FINALIZED",
        "DECLINED",
        "NOT_PROCEEDING",
      ],
    },

    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    note: {
      type: String,
      trim: true,
    },

    changedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false,
  }
);

const shortlistSchema = new mongoose.Schema(
  {
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

    source: {
      type: String,
      enum: ["MATCHING", "MANUAL"],
      default: "MATCHING",
      required: true,
    },

    status: {
      type: String,
      enum: [
        "SHORTLISTED",
        "INTEREST_SENT",
        "INTEREST_RECEIVED",
        "MUTUAL_INTEREST",
        "BIODATA_SHARED",
        "MEETING_SCHEDULED",
        "FINALIZED",
        "DECLINED",
        "NOT_PROCEEDING",
      ],
      default: "SHORTLISTED",
      required: true,
    },

    initiatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Initiated by user is required"],
    },

    matchPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },

    matchedFields: {
      type: [String],
      default: [],
    },

    notes: {
      type: String,
      trim: true,
    },

    statusHistory: {
      type: [statusHistorySchema],
      default: [],
    },

    archived: {
      type: Boolean,
      default: false,
    },

    archivedAt: {
      type: Date,
      default: null,
    },

    archivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

shortlistSchema.index(
  { userA: 1, userB: 1 },
  { unique: true }
);

shortlistSchema.pre("validate", function () {
  if (
    this.userA &&
    this.userB &&
    this.userA.toString() === this.userB.toString()
  ) {
    throw new Error(
      "User A and User B cannot be the same user"
    );
  }
});

const Shortlist = mongoose.model(
  "Shortlist",
  shortlistSchema
);

module.exports = Shortlist;