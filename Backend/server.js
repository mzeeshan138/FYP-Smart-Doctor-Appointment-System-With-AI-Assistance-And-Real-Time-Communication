import dotenv from 'dotenv';
import express from "express";
import cors from "cors";
import http from "http";       
import { Server } from "socket.io";   
import connectDB from "./config/mongodb.js";
import connectCloudinary from "./config/cloudnary.js";
import adminRouter from "./routes/adminRoute.js";
import aiChatRouter from "./routes/aiChatRoutes.js";
import doctorRouter from "./routes/doctorRoute.js";
import userRouter from "./routes/usersRoute.js";
import chatRouter from "./routes/chatRoutes.js"; 

//Setting Environment
if (process.env.NODE_ENV !== 'PRODUCTION') {
  dotenv.config({ path: 'config/config.env' });
}

//app config
const app = express();
const port = process.env.PORT || 4000;

// ==================
// Create HTTP Server
// ==================
const server = http.createServer(app);  

// ==================
// Initialize Socket
// ==================
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:5174","http://localhost:8000"],
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
  origin: ["http://localhost:3000", "http://localhost:5174","http://localhost:8000"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
}));

//api end points
app.use("/api/admin", adminRouter);
app.use("/api/doctor", doctorRouter);
app.use("/api/user", userRouter);
app.use("/api/ai", aiChatRouter);
app.use("/api/chat", chatRouter); 


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