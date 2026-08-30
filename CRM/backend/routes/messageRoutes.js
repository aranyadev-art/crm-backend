const express = require("express");

const {
  getConversations,
  createConversation,
  getConversationMessages,
  sendMessage,
  markAsRead,
  getUnreadCount,
} = require("../controllers/messageController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();


// ========================================
// ALL MESSAGE ROUTES ARE PROTECTED
// ========================================
// Har route pe login zaroori hai — koi bhi route bina
// authentication ke access nahi hoga.

router.use(protect);


// ========================================
// UNREAD COUNT (Sidebar badge)
// ========================================
// IMPORTANT: /unread-count route se pehle rakha, warna
// agar future mein /:id jaisi route add ho, conflict ho sakta hai.

router.get("/unread-count", getUnreadCount);


// ========================================
// CONVERSATIONS
// ========================================

router.get("/conversations", getConversations);
router.post("/conversations", createConversation);
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