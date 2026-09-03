const mongoose = require("mongoose");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const User = require("../models/User");
const Admin = require("../models/Admin");

// ========================================
// HELPER: is current user admin/staff?
// ========================================

const isStaffRole = (role) => role === "admin" || role === "staff";

// ========================================
// GET MY CONVERSATIONS
// ========================================

const getConversations = async (req, res) => {
  try {
    const myId = req.user.userId;
    const myRole = req.user.role;

    const filter = isStaffRole(myRole)
      ? { participantStaff: myId }
      : { participantUser: myId };

    const conversations = await Conversation.find(filter)
      .populate(
        "participantUser",
        "fullName profilePhoto onlineStatus lastSeen"
      )
      .populate("participantStaff", "fullName")
      .sort({ lastMessageAt: -1 });

    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await Message.countDocuments({
          conversation: conv._id,
          receiver: myId,
          isRead: false,
        });

        return {
          ...conv.toObject(),
          unreadCount,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: conversationsWithUnread.length,
      data: conversationsWithUnread,
    });
  } catch (error) {
    console.error("Get conversations error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch conversations",
      error: error.message,
    });
  }
};

// ========================================
// START / GET CONVERSATION
// ========================================

const createConversation = async (req, res) => {
  try {
    if (!isStaffRole(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Only admin/staff can start a conversation",
      });
    }

    const { userId } = req.body;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Valid userId is required",
      });
    }

    const userExists = await User.findById(userId).select("_id");

    if (!userExists) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    let conversation = await Conversation.findOne({
      participantUser: userId,
      participantStaff: req.user.userId,
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participantUser: userId,
        participantStaff: req.user.userId,
      });
    }

    const populatedConversation = await Conversation.findById(
      conversation._id
    )
      .populate(
        "participantUser",
        "fullName profilePhoto onlineStatus lastSeen"
      )
      .populate("participantStaff", "fullName");

    res.status(201).json({
      success: true,
      message: "Conversation ready",
      data: populatedConversation,
    });
  } catch (error) {
    console.error("Create conversation error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to start conversation",
      error: error.message,
    });
  }
};

// ========================================
// GET SINGLE CONVERSATION + MESSAGES
// ========================================

const getConversationMessages = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id)
      .populate(
        "participantUser",
        "fullName profilePhoto onlineStatus lastSeen"
      )
      .populate("participantStaff", "fullName");

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    const myId = req.user.userId;

    const isParticipant =
      conversation.participantUser?._id.toString() === myId ||
      conversation.participantStaff?._id.toString() === myId;

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this conversation",
      });
    }

    const messages = await Message.find({
      conversation: conversation._id,
    }).sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      conversation,
      data: messages,
    });
  } catch (error) {
    console.error("Get conversation messages error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch conversation",
      error: error.message,
    });
  }
};

// ========================================
// SEND MESSAGE
// ========================================

const sendMessage = async (req, res) => {
  try {
    const { conversationId, message } = req.body;

    if (!conversationId || !message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "conversationId and message are required",
      });
    }

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    const myId = req.user.userId;
    const myRole = req.user.role;

    const isParticipantUser =
      conversation.participantUser.toString() === myId;

    const isParticipantStaff =
      conversation.participantStaff.toString() === myId;

    if (!isParticipantUser && !isParticipantStaff) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this conversation",
      });
    }

    const receiverId = isParticipantUser
      ? conversation.participantStaff
      : conversation.participantUser;

    const receiverRole = isParticipantUser ? "staff" : "user";

    const newMessage = await Message.create({
      conversation: conversation._id,
      sender: myId,
      senderRole: myRole,
      receiver: receiverId,
      receiverRole,
      message: message.trim(),
      messageType: "TEXT",
    });

    conversation.lastMessage = message.trim();
    conversation.lastMessageAt = new Date();

    await conversation.save();

    // ========================================
    // SOCKET.IO - REAL TIME MESSAGE
    // ========================================

    const io = req.app.get("io");

    if (io) {
      io.to(`user:${receiverId.toString()}`).emit(
        "new_message",
        {
          conversationId: conversation._id,
          message: newMessage,
        }
      );

      io.to(`user:${myId}`).emit(
        "conversation_updated",
        {
          conversationId: conversation._id,
          lastMessage: newMessage,
          lastMessageAt: conversation.lastMessageAt,
        }
      );

      io.to(`user:${receiverId.toString()}`).emit(
        "conversation_updated",
        {
          conversationId: conversation._id,
          lastMessage: newMessage,
          lastMessageAt: conversation.lastMessageAt,
        }
      );
    }

    res.status(201).json({
      success: true,
      message: "Message sent",
      data: newMessage,
    });
  } catch (error) {
    console.error("Send message error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to send message",
      error: error.message,
    });
  }
};

// ========================================
// DELETE MESSAGE — DELETE FOR EVERYONE
// ========================================
// Sirf message ka sender apna message delete kar sakta hai.

const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid message ID",
      });
    }

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    const myId = req.user.userId;

    // ========================================
    // ONLY MESSAGE SENDER CAN DELETE
    // ========================================

    if (message.sender.toString() !== myId) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own messages",
      });
    }

    const conversationId = message.conversation;
    const receiverId = message.receiver;

    // Message delete karne se pehle message ID save karo
    const deletedMessageId = message._id.toString();

    await Message.findByIdAndDelete(messageId);

    // ========================================
    // UPDATE CONVERSATION LAST MESSAGE
    // ========================================

    const latestMessage = await Message.findOne({
      conversation: conversationId,
    }).sort({ createdAt: -1 });

    const conversation = await Conversation.findById(
      conversationId
    );

    if (conversation) {
      if (latestMessage) {
        conversation.lastMessage = latestMessage.message;
        conversation.lastMessageAt = latestMessage.createdAt;
      } else {
        conversation.lastMessage = "";
        conversation.lastMessageAt = conversation.createdAt;
      }

      await conversation.save();
    }

    // ========================================
    // SOCKET.IO - REAL TIME DELETE
    // ========================================

    const io = req.app.get("io");

    if (io) {
      // Sender ko
      io.to(`user:${myId}`).emit(
        "message_deleted",
        {
          conversationId: conversationId,
          messageId: deletedMessageId,
        }
      );

      // Receiver ko
      io.to(`user:${receiverId.toString()}`).emit(
        "message_deleted",
        {
          conversationId: conversationId,
          messageId: deletedMessageId,
        }
      );

      // Sidebar update
      if (conversation) {
        io.to(`user:${myId}`).emit(
          "conversation_updated",
          {
            conversationId: conversationId,
            lastMessage: latestMessage || null,
            lastMessageAt: conversation.lastMessageAt,
          }
        );

        io.to(`user:${receiverId.toString()}`).emit(
          "conversation_updated",
          {
            conversationId: conversationId,
            lastMessage: latestMessage || null,
            lastMessageAt: conversation.lastMessageAt,
          }
        );
      }
    }

    res.status(200).json({
      success: true,
      message: "Message deleted for everyone",
      data: {
        messageId: deletedMessageId,
        conversationId,
      },
    });
  } catch (error) {
    console.error("Delete message error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to delete message",
      error: error.message,
    });
  }
};

// ========================================
// MARK CONVERSATION AS READ
// ========================================

const markAsRead = async (req, res) => {
  try {
    const conversation = await Conversation.findById(
      req.params.conversationId
    );

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    const myId = req.user.userId;

    const isParticipant =
      conversation.participantUser.toString() === myId ||
      conversation.participantStaff.toString() === myId;

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this conversation",
      });
    }

    await Message.updateMany(
      {
        conversation: conversation._id,
        receiver: myId,
        isRead: false,
      },
      {
        isRead: true,
        readAt: new Date(),
      }
    );

    res.status(200).json({
      success: true,
      message: "Messages marked as read",
    });
  } catch (error) {
    console.error("Mark as read error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to mark messages as read",
      error: error.message,
    });
  }
};

// ========================================
// GET MY TOTAL UNREAD COUNT
// ========================================

const getUnreadCount = async (req, res) => {
  try {
    const count = await Message.countDocuments({
      receiver: req.user.userId,
      isRead: false,
    });

    res.status(200).json({
      success: true,
      unreadCount: count,
    });
  } catch (error) {
    console.error("Get unread count error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch unread count",
      error: error.message,
    });
  }
};

module.exports = {
  getConversations,
  createConversation,
  getConversationMessages,
  sendMessage,
  deleteMessage,
  markAsRead,
  getUnreadCount,
};
