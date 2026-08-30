const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: [true, "Conversation is required"],
    },

    // ========================================
    // SENDER / RECEIVER
    // ========================================
    // sender/receiver Admin collection se ho sakta hai ya User
    // collection se — isliye plain ObjectId rakha hai (ref nahi diya
    // seedha), aur senderRole/receiverRole se pata chalega kis
    // collection se hai. Populate controller mein manually karenge.

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Sender is required"],
    },

    senderRole: {
      type: String,
      enum: ["admin", "staff", "user"],
      required: [true, "Sender role is required"],
    },

    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Receiver is required"],
    },

    receiverRole: {
      type: String,
      enum: ["admin", "staff", "user"],
      required: [true, "Receiver role is required"],
    },

    // ========================================
    // MESSAGE CONTENT
    // ========================================

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

    // ========================================
    // READ STATUS
    // ========================================

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

messageSchema.index({ conversation: 1, createdAt: 1 });

const Message = mongoose.model("Message", messageSchema);

module.exports = Message;