import http from "http";       
import { Server } from "socket.io";   
import connectDB from "./config/mongodb.js";
import connectCloudinary from "./config/cloudnary.js";
// Old AI chat (FastAPI) — uncomment to use sklearn chatbot instead of Gemini
// import aiChatRouter from "./routes/aiChatRoutes.js";
import app from "./app.js";

const port = process.env.PORT ;
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map((origin) => origin.trim())
  : [];

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
server.listen(port, () => 
  console.log(`\nserver is running on ${port}`)
);
