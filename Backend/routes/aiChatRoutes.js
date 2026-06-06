// Old AI chat route (FastAPI) — enable in server.js to use this instead of Gemini
import express from "express";
import { aiChatHandler } from "../controllers/aiChatController.js";

const aiChatRouter = express.Router();

aiChatRouter.post("/chat", aiChatHandler);

export default aiChatRouter;
