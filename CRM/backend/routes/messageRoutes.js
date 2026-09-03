const express = require("express");

const {
  getConversations,
  createConversation,
  getConversationMessages,
  sendMessage,
  deleteMessage,
  markAsRead,
  getUnreadCount,
} = require("../controllers/messageController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

// ========================================
// CONVERSATIONS
// ========================================

router.get("/unread-count", getUnreadCount);

router.get("/conversations", getConversations);

router.post("/conversations", createConversation);

router.get("/conversation/:id", getConversationMessages);

// ========================================
// MESSAGES
// ========================================

router.post("/", sendMessage);

// Delete message for everyone
router.delete("/:messageId", deleteMessage);

// ========================================
// READ STATUS
// ========================================

router.patch("/read/:conversationId", markAsRead);

module.exports = router;
