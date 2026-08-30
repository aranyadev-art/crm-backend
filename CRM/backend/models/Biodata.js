const mongoose = require("mongoose");

const biodataSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
      unique: true,
    },

    template: {
      type: String,
      enum: [
        "CLASSIC",
        "MODERN",
        "PREMIUM",
      ],
      default: "CLASSIC",
    },

    status: {
      type: String,
      enum: [
        "DRAFT",
        "GENERATED",
        "SHARED",
      ],
      default: "DRAFT",
    },

    displayFields: {
      personalDetails: {
        type: Boolean,
        default: true,
      },

      education: {
        type: Boolean,
        default: true,
      },

      profession: {
        type: Boolean,
        default: true,
      },

      familyDetails: {
        type: Boolean,
        default: true,
      },

      contactDetails: {
        type: Boolean,
        default: false,
      },

      address: {
        type: Boolean,
        default: true,
      },

      horoscope: {
        type: Boolean,
        default: false,
      },
    },

    customNote: {
      type: String,
      trim: true,
      default: "",
    },

    generatedAt: {
      type: Date,
      default: null,
    },
    pdfUrl: {
  type: String,
  default: null,
},

pdfPublicId: {
  type: String,
  default: null,
},

    sharedAt: {
      type: Date,
      default: null,
    },

    sharedWith: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Biodata = mongoose.model(
  "Biodata",
  biodataSchema
);

module.exports = Biodata;