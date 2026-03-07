import express from "express";

import  authUser from "../middlewares/authUser.js";
import  authAdmin  from "../middlewares/authAdmin.js";

import {
  getConversations,
  getMessages,
  sendMessage,
  deleteMessage,
  clearConversation,
} from "../controllers/chatController.js";

const router = express.Router();

/* ================= USER CHAT ================= */
// Get all conversations
router.get("/list", authUser, getConversations);

// Get messages of a conversation
router.get("/messages/:conversationId", authUser, getMessages);

// Send message
router.post("/send", authUser, sendMessage);

// Delete own message
router.delete("/message/:messageId", authUser, deleteMessage);

// Clear full conversation
router.delete("/clear/:conversationId", authUser, clearConversation);



export default router;