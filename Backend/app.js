import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import adminRouter from "./routes/adminRoute.js";
import geminiChatRouter from "./routes/geminiChatRoutes.js";
import doctorRouter from "./routes/doctorRoute.js";
import userRouter from "./routes/usersRoute.js";
import chatRouter from "./routes/chatRoutes.js";
import { stripeWebhook } from "./controllers/stripeController.js";

if (process.env.NODE_ENV !== "PRODUCTION") {
  dotenv.config({ path: "config/config.env" });
}

const app = express();
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map((origin) => origin.trim())
  : [];

app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), stripeWebhook);
app.use(express.json());
app.use(cors({ origin: allowedOrigins, credentials: true, methods: ["GET", "POST", "PUT", "DELETE"] }));
app.use("/api/admin", adminRouter);
app.use("/api/doctor", doctorRouter);
app.use("/api/user", userRouter);
app.use("/api/gemini-ai", geminiChatRouter);
app.use("/api/chat", chatRouter);

export default app;
