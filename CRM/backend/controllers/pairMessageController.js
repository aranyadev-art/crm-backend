const mongoose = require("mongoose");
const PairConversation = require("../models/PairConversation");
const PairMessage = require("../models/PairMessage");
const Shortlist = require("../models/Shortlist");


// ========================================
// ALLOWED STATUSES FOR CHAT ACTIVATION
// ========================================

const CHAT_ALLOWED_STATUSES = ["MEETING_SCHEDULED", "FINALIZED"];


// ========================================
// START / GET PAIR CONVERSATION
// ========================================
// Body: { partnerUserId }
// Security: verify karta hai ki main aur partner dono ek
// Shortlist mein hain, aur uska status chat allow karta hai.
// Consistent ordering: chhota ObjectId string hamesha
// participantA banega — taaki duplicate na ban sake chahe
// koi bhi side pehle request kare.

const startConversation = async (req, res) => {
  try {

    const myId = req.user.userId;
    const { partnerUserId } = req.body;

    if (!partnerUserId || !mongoose.Types.ObjectId.isValid(partnerUserId)) {
      return res.status(400).json({
        success: false,
        message: "Valid partnerUserId is required",
      });
    }

    if (partnerUserId === myId) {
      return res.status(400).json({
        success: false,
        message: "Cannot start a conversation with yourself",
      });
    }

    // Verify: dono ek shortlist mein hain, status allow karta hai
    const shortlist = await Shortlist.findOne({
      $or: [
        { userA: myId, userB: partnerUserId },
        { userA: partnerUserId, userB: myId },
      ],
      archived: false,
    });

    if (!shortlist) {
      return res.status(404).json({
        success: false,
        message: "No shortlist found between you and this user",
      });
    }

    if (!CHAT_ALLOWED_STATUSES.includes(shortlist.status)) {
      return res.status(403).json({
        success: false,
        message: "Chat is not available yet for this match",
      });
    }

    // Consistent order — chhota ID hamesha participantA
    const [participantA, participantB] =
      myId < partnerUserId ? [myId, partnerUserId] : [partnerUserId, myId];

    let conversation = await PairConversation.findOne({
      participantA,
      participantB,
    });

    if (!conversation) {
      conversation = await PairConversation.create({
        participantA,
        participantB,
        shortlist: shortlist._id,
      });
    }

    const populatedConversation = await PairConversation.findById(conversation._id)
      .populate("participantA", "fullName profilePhoto onlineStatus lastSeen")
      .populate("participantB", "fullName profilePhoto onlineStatus lastSeen");

    res.status(201).json({
      success: true,
      message: "Conversation ready",
      data: populatedConversation,
    });

  } catch (error) {
    console.error("Start pair conversation error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to start conversation",
      error: error.message,
    });
  }
};


// ========================================
// GET MY PAIR CONVERSATIONS
// ========================================

const getConversations = async (req, res) => {
  try {

    const myId = req.user.userId;

    const conversations = await PairConversation.find({
      $or: [{ participantA: myId }, { participantB: myId }],
    })
      .populate("participantA", "fullName profilePhoto onlineStatus lastSeen")
      .populate("participantB", "fullName profilePhoto onlineStatus lastSeen")
      .sort({ lastMessageAt: -1 });

    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await PairMessage.countDocuments({
          conversation: conv._id,
          receiver: myId,
          isRead: false,
        });

        return { ...conv.toObject(), unreadCount };
      })
    );

    res.status(200).json({
      success: true,
      count: conversationsWithUnread.length,
      data: conversationsWithUnread,
    });

  } catch (error) {
    console.error("Get pair conversations error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch conversations",
      error: error.message,
    });
  }
};


// ========================================
// GET SINGLE CONVERSATION + MESSAGES
// ========================================

const getConversationMessages = async (req, res) => {
  try {

    const conversation = await PairConversation.findById(req.params.id)
      .populate("participantA", "fullName profilePhoto onlineStatus lastSeen")
      .populate("participantB", "fullName profilePhoto onlineStatus lastSeen");

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    const myId = req.user.userId;

    const isParticipant =
      conversation.participantA._id.toString() === myId ||
      conversation.participantB._id.toString() === myId;

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this conversation",
      });
    }

    const messages = await PairMessage.find({
      conversation: conversation._id,
    }).sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      conversation,
      data: messages,
    });

  } catch (error) {
    console.error("Get pair conversation messages error:", error.message);

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

    const conversation = await PairConversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    const myId = req.user.userId;

    const isA = conversation.participantA.toString() === myId;
    const isB = conversation.participantB.toString() === myId;

    if (!isA && !isB) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this conversation",
      });
    }

    const receiverId = isA ? conversation.participantB : conversation.participantA;

    const newMessage = await PairMessage.create({
      conversation: conversation._id,
      sender: myId,
      receiver: receiverId,
      message: message.trim(),
      messageType: "TEXT",
    });

    conversation.lastMessage = message.trim();
    conversation.lastMessageAt = new Date();
    await conversation.save();

    res.status(201).json({
      success: true,
      message: "Message sent",
      data: newMessage,
    });

  } catch (error) {
    console.error("Send pair message error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to send message",
      error: error.message,
    });
  }
};


// ========================================
// MARK AS READ
// ========================================

const markAsRead = async (req, res) => {
  try {

    const conversation = await PairConversation.findById(req.params.conversationId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    const myId = req.user.userId;

    const isParticipant =
      conversation.participantA.toString() === myId ||
      conversation.participantB.toString() === myId;

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this conversation",
      });
    }

    await PairMessage.updateMany(
      { conversation: conversation._id, receiver: myId, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.status(200).json({
      success: true,
      message: "Messages marked as read",
    });

  } catch (error) {
    console.error("Mark pair messages as read error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to mark messages as read",
      error: error.message,
    });
  }
};


// ========================================
// GET MY TOTAL UNREAD COUNT (pair messages only)
// ========================================

const getUnreadCount = async (req, res) => {
  try {

    const count = await PairMessage.countDocuments({
      receiver: req.user.userId,
      isRead: false,
    });

    res.status(200).json({
      success: true,
      unreadCount: count,
    });

  } catch (error) {
    console.error("Get pair unread count error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch unread count",
      error: error.message,
    });
  }
};


module.exports = {
  startConversation,
  getConversations,
  getConversationMessages,
  sendMessage,
  markAsRead,
  getUnreadCount,
};