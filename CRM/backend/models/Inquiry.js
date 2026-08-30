const mongoose = require("mongoose");

const inquirySchema = new mongoose.Schema(
  {
    // =========================
    // BASIC LEAD INFO
    // =========================

    fullName: {
      type: String,
      required: [true, "Full Name is required"],
      trim: true,
      minlength: [2, "Full Name must be at least 2 characters"],
    },

    contactNo: {
      type: String,
      required: [true, "Contact number is required"],
      trim: true,
      match: [
        /^[6-9]\d{9}$/,
        "Please enter a valid 10-digit mobile number",
      ],
    },

    alternateContactNo: {
      type: String,
      trim: true,
      match: [
        /^$|^[6-9]\d{9}$/,
        "Please enter a valid 10-digit mobile number",
      ],
    },

    emailId: {
      type: String,
      trim: true,
      lowercase: true,
      match: [
        /^$|^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please enter a valid email address",
      ],
    },

    // =========================
    // DEMOGRAPHIC INFO (light, optional)
    // =========================

    gender: {
      type: String,
      enum: ["Male", "Female"],
    },

    approxAge: {
      type: Number,
    },

    dob: {
      type: Date,
    },

    city: {
      type: String,
      trim: true,
    },

    // =========================
    // CRM SPECIFIC FIELDS
    // =========================

    source: {
      type: String,
      required: [true, "Source is required"],
      enum: [
        "PHONE",
        "WHATSAPP",
        "WEBSITE",
        "WALK_IN",
        "REFERRAL",
        "SOCIAL_MEDIA",
        "OTHER",
      ],
    },

    initialRequirement: {
      type: String,
      trim: true,
    },

    notes: {
      type: String,
      trim: true,
    },

    assignedStaff: {
      type: String,
      trim: true,
    },

    status: {
      type: String,
      enum: [
        "NEW",
        "CONTACTED",
        "FOLLOW_UP",
        "QUALIFIED",
        "CONVERTED",
        "NOT_INTERESTED",
        "INVALID",
        "LOST",
      ],
      default: "NEW",
    },

    followUpRequired: {
      type: Boolean,
      default: false,
    },

    nextFollowUpDate: {
      type: Date,
    },

    // =========================
    // CONVERSION TRACKING
    // =========================

    convertedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // =========================
    // SYSTEM / META
    // =========================

    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Inquiry = mongoose.model("Inquiry", inquirySchema);

module.exports = Inquiry;