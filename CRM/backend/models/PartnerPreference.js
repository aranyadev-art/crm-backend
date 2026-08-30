const mongoose = require("mongoose");

const partnerPreferenceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User profile is required"],
    },

  preferredGender: {
  type: String,
  trim: true,
  enum: ["Male", "Female"],
},
     preferredCity: {
  type: String,
  trim: true,
},

    preferredState: {
  type: String,
  trim: true,
},

    minAge: {
      type: Number,
    },

    maxAge: {
      type: Number,
    },

    minHeight: {
      type: String,
      trim: true,
    },

    maxHeight: {
      type: String,
      trim: true,
    },

    maritalStatus: {
      type: String,
      trim: true,
    },

    education: {
      type: String,
      trim: true,
    },

    profession: {
      type: String,
      trim: true,
    },

    location: {
      type: String,
      trim: true,
    },

    additionalPreference: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const PartnerPreference = mongoose.model(
  "PartnerPreference",
  partnerPreferenceSchema
);

module.exports = PartnerPreference;