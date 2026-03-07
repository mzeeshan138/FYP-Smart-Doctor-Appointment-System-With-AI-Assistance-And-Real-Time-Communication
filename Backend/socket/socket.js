import { Server } from "socket.io";

let onlineUsers = new Map();

export const initSocket = (server) => {
  const io = new Server(server, {
    cors: { origin: "*" },
  });

  io.on("connection", (socket) => {
    socket.on("user_online", (userId) => {
      onlineUsers.set(userId, socket.id);
      io.emit("online_users", Array.from(onlineUsers.keys()));
    });

    socket.on("join_conversation", (conversationId) => {
      socket.join(conversationId);
    });

    socket.on("send_message", (data) => {
      io.to(data.conversationId).emit("receive_message", data);
    });

    socket.on("disconnect", () => {
      for (let [key, value] of onlineUsers.entries()) {
        if (value === socket.id) onlineUsers.delete(key);
      }
      io.emit("online_users", Array.from(onlineUsers.keys()));
    });
  });
};