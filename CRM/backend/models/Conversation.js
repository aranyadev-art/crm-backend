const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    // ========================================
    // PARTICIPANTS
    // ========================================
    // Ek conversation hamesha EK matrimonial User aur
    // EK Admin/Staff member ke beech hoti hai (Option B —
    // har staff member ki alag chat).

    participantUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Matrimonial user is required"],
    },

    participantStaff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: [true, "Staff/Admin participant is required"],
    },

    // ========================================
    // LAST MESSAGE PREVIEW (denormalized for list view)
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
// ONE CONVERSATION PER (user, staff) PAIR
// ========================================
// Isse dobara "Message" button dabane pe naya conversation
// nahi banega — existing hi milega/reuse hoga.

conversationSchema.index(
  { participantUser: 1, participantStaff: 1 },
  { unique: true }
);

const Conversation = mongoose.model("Conversation", conversationSchema);

module.exports = Conversation;