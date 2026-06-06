import express from "express";

import authAny from "../middlewares/authAny.js";

import {
  getConversations,
  deleteConversation,
  getMessages,
  sendMessage,
  deleteMessage,
  clearConversation,
} from "../controllers/chatController.js";

const router = express.Router();

/* ================= CHAT (user + doctor) ================= */
router.get("/list", authAny, getConversations);
router.delete("/conversation/:conversationId", authAny, deleteConversation);
router.get("/messages/:conversationId", authAny, getMessages);
router.post("/send", authAny, sendMessage);
router.delete("/message/:messageId", authAny, deleteMessage);
router.delete("/clear/:conversationId", authAny, clearConversation);


export default router;