const express = require("express");

const {
  startConversation,
  getConversations,
  getConversationMessages,
  sendMessage,
  markAsRead,
  getUnreadCount,
} = require("../controllers/pairMessageController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();


// ========================================
// ALL PAIR MESSAGE ROUTES ARE PROTECTED
// ========================================

router.use(protect);


// ========================================
// UNREAD COUNT
// ========================================

router.get("/unread-count", getUnreadCount);


// ========================================
// CONVERSATIONS
// ========================================

router.post("/start", startConversation);
router.get("/conversations", getConversations);
router.get("/conversation/:id", getConversationMessages);


// ========================================
// SEND MESSAGE
// ========================================

router.post("/", sendMessage);


// ========================================
// MARK AS READ
// ========================================

router.patch("/read/:conversationId", markAsRead);


module.exports = router;