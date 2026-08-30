const mongoose = require("mongoose");

const pairConversationSchema = new mongoose.Schema(
  {
    // ========================================
    // PARTICIPANTS — dono matrimonial Users
    // ========================================

    participantA: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Participant A is required"],
    },

    participantB: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Participant B is required"],
    },

    // ========================================
    // LINK BACK — traceability ke liye, kis Shortlist
    // ki wajah se ye pair chat activate hui
    // ========================================

    shortlist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shortlist",
      required: [true, "Related shortlist is required"],
    },

    // ========================================
    // LAST MESSAGE PREVIEW (denormalized)
    // ========================================

    lastMessage: {
      type: String,
      trim: true,
      default: "",
    },

    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
  },

  {
    timestamps: true,
  }
);

// ========================================
// ONE PAIR CONVERSATION PER (A, B) PAIR
// ========================================

pairConversationSchema.index(
  { participantA: 1, participantB: 1 },
  { unique: true }
);

const PairConversation = mongoose.model("PairConversation", pairConversationSchema);

module.exports = PairConversation;