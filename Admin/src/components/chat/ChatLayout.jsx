import { useEffect, useState, useContext, useRef } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import { DoctorContext } from "../../context/DontorContext";
import SidebarIcons from "./SidebarIcons";
import ConversationList from "./ConversationList";
import ChatBox from "./ChatBox";

const ChatLayout = ({ currentUser }) => {
  
  const { backendUrl, dToken } = useContext(DoctorContext);

  const [conversations, setConversations] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);

  const socket = useRef(null);

  /* ================= SOCKET ================= */
  useEffect(() => {
    if (!currentUser?._id) return;

    socket.current = io("http://localhost:4000");

    socket.current.emit("user_online", currentUser._id);

    socket.current.on("online_users", (users) => {
      setOnlineUsers(users);
    });

   
    socket.current.off("receive_message");

    socket.current.on("receive_message", (data) => {
      if (data.conversationId === currentChat?._id) {
        setMessages((prev) => [...prev, data]);
      }
    });

    return () => {
      socket.current.disconnect();
    };
  }, [currentUser, currentChat]);

  /* ================= FETCH CONVERSATIONS ================= */
  useEffect(() => {
    if (!currentUser?._id) return;

    const fetchConversations = async () => {
      try {
        const { data } = await axios.get(
          backendUrl + "/api/chat/list",
          { headers: { token: dToken } }
        );
        setConversations(data);
      } catch (err) {
        console.log("Conversation fetch error:", err.response?.data);
      }
    };

    fetchConversations();
  }, [currentUser,backendUrl]);

  /* ================= FETCH MESSAGES ================= */
  useEffect(() => {
    if (!currentChat) return;

    const fetchMessages = async () => {
      try {
        const { data } = await axios.get(
          backendUrl + "/api/chat/messages/" + currentChat._id,
          { headers: { token: dToken } ,
    params: {
      userModel: "doctor",
    },},
        );
        setMessages(data);
      } catch (err) {
        console.log("Message fetch error:", err.response?.data);
      }
    };

    fetchMessages();
  }, [currentChat]);

  return (
    <div className="flex h-screen">
      <SidebarIcons />

      <ConversationList
        conversations={conversations}
        currentUser={currentUser}
        setCurrentChat={setCurrentChat}
        onlineUsers={onlineUsers}
        setConversations={setConversations}
        backendUrl={backendUrl}
        dToken={ dToken }
      />

      <ChatBox
        currentChat={currentChat}
        currentUser={currentUser}
        messages={messages}
        setMessages={setMessages}
        socket={socket}
        onlineUsers={onlineUsers}
        setConversations={setConversations}
        dToken={dToken}
        backendUrl={backendUrl}
      />
    </div>
  );
};

export default ChatLayout;