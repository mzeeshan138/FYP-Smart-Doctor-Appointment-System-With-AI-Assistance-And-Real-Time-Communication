import dotenv from 'dotenv';
import express from "express";
import cors from "cors";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import { Server } from "socket.io";
import connectDB from "./config/mongodb.js";
import connectCloudinary from "./config/cloudnary.js";
import adminRouter from "./routes/adminRoute.js";
// Old AI chat (FastAPI) — uncomment to use sklearn chatbot instead of Gemini
// import aiChatRouter from "./routes/aiChatRoutes.js";
import geminiChatRouter from "./routes/geminiChatRoutes.js";
import doctorRouter from "./routes/doctorRoute.js";
import userRouter from "./routes/usersRoute.js";
import chatRouter from "./routes/chatRoutes.js"; 
import { stripeWebhook } from "./controllers/stripeController.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Setting Environment
const nodeEnv = process.env.NODE_ENV?.trim();

if (nodeEnv === "PRODUCTION") {
  // Local production: loads Backend/.env.production
  // Web host: platform env vars are used (dotenv does not override existing vars)
  dotenv.config({ path: path.join(__dirname, ".env.production") });
} else {
  dotenv.config({ path: path.join(__dirname, "config/config.env") });
}

//app config
const app = express();
const port = process.env.PORT;
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map((origin) => origin.trim())
  : [];

// Stripe webhook must receive raw body (before express.json)
app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhook
);

// ==================
// Create HTTP Server
// ==================
const server = http.createServer(app);  

// ==================
// Initialize Socket
// ==================
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true
  }
});

// ==================
// Database & Cloud
// ==================
connectDB();
connectCloudinary();

//middlewares
app.use(express.json());
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
}));

//api end points
app.use("/api/admin", adminRouter);
app.use("/api/doctor", doctorRouter);
app.use("/api/user", userRouter);
// app.use("/api/ai", aiChatRouter); // old FastAPI chatbot
app.use("/api/gemini-ai", geminiChatRouter);
app.use("/api/chat", chatRouter);

// ==================
// Production: serve Frontend + Admin builds
// ==================
if (nodeEnv === "PRODUCTION") {
  const frontendBuild = path.join(__dirname, "../Frontend/dist");
  const adminBuild = path.join(__dirname, "../Admin/dist");

  app.use(express.static(frontendBuild));
  app.use("/admin", express.static(adminBuild));

  app.get("/admin/*", (req, res) => {
    res.sendFile(path.join(adminBuild, "index.html"));
  });

  app.get("*", (req, res) => {
    res.sendFile(path.join(frontendBuild, "index.html"));
  });
}

// ==================
// Socket Logic
// ==================
let onlineUsers = [];

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("addUser", (userId) => {
    if (!onlineUsers.some(user => user.userId === userId)) {
      onlineUsers.push({ userId, socketId: socket.id });
    }
  });

  socket.on("sendMessage", ({ senderId, receiverId, text }) => {
    const receiver = onlineUsers.find(user => user.userId === receiverId);
    if (receiver) {
      io.to(receiver.socketId).emit("getMessage", {
        senderId,
        text,
      });
    }
  });

  socket.on("disconnect", () => {
    onlineUsers = onlineUsers.filter(user => user.socketId !== socket.id);
    console.log("User disconnected:", socket.id);
  });
});

// ==================
// Start Server
// ==================
server.listen(port, () => {
  console.log(`\nserver is running on ${port}`);
  console.log(`NODE_ENV: ${nodeEnv || "undefined"}`);
  if (nodeEnv === "PRODUCTION") {
    console.log("Patient app: /");
    console.log("Admin panel: /admin");
  }
});