import express from "express";
import { aiChatHandler } from "../controllers/aiChatController.js";

const aiChatRouter = express.Router();

// AI Chatbot API
aiChatRouter.post("/chat", aiChatHandler);

export default aiChatRouter;
