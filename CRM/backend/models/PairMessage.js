const mongoose = require("mongoose");

const pairMessageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PairConversation",
      required: [true, "Conversation is required"],
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Sender is required"],
    },

    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Receiver is required"],
    },

    message: {
      type: String,
      trim: true,
      required: [true, "Message content is required"],
    },

    messageType: {
      type: String,
      enum: ["TEXT", "SYSTEM"],
      default: "TEXT",
    },

    isRead: {
      type: Boolean,
      default: false,
    },

    readAt: {
      type: Date,
      default: null,
    },
  },

  {
    timestamps: true,
  }
);

// ========================================
// FAST LOOKUP: messages of a conversation, in order
// ========================================

pairMessageSchema.index({ conversation: 1, createdAt: 1 });

const PairMessage = mongoose.model("PairMessage", pairMessageSchema);

module.exports = PairMessage;