import express from "express";
import { geminiChatHandler } from "../controllers/geminiChatController.js";

const geminiChatRouter = express.Router();

// Gemini AI Chatbot API (no FastAPI)
geminiChatRouter.post("/chat", geminiChatHandler);

export default geminiChatRouter;
