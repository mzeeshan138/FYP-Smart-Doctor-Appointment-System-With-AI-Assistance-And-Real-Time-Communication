import { useState, useContext, useRef, useEffect } from "react";
import axios from "axios";
import MessageBubble from "./MessageBubble";
import { BsThreeDotsVertical } from "react-icons/bs";
import { MdDeleteOutline } from "react-icons/md";
import { AiOutlineClear } from "react-icons/ai";
import { FiCheckSquare } from "react-icons/fi";

const ChatBox = ({
  currentChat,
  currentUser,
  messages,
  setMessages,
  socket,
  onlineUsers,
  setConversations,
  dToken,
  backendUrl
}) => {

  const [newMessage, setNewMessage] = useState("");
  const [showMenu, setShowMenu] = useState(false);

  const [selectMode, setSelectMode] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState([]);

  const messagesEndRef = useRef(null);

  /* ================= AUTO SCROLL ================= */

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!currentChat) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        Select Conversation
      </div>
    );
  }

  const friend =
    currentUser._id === currentChat.userId?._id
      ? currentChat.docId
      : currentChat.userId;

  /* ================= MESSAGE SELECT ================= */

  const toggleSelect = (id) => {

    if (!selectMode) return;

    setSelectedMessages((prev) =>
      prev.includes(id)
        ? prev.filter((m) => m !== id)
        : [...prev, id]
    );

  };

  /* ================= SEND MESSAGE ================= */

  const handleSend = async () => {

    if (!newMessage.trim()) return;

    try {

      const { data } = await axios.post(
        backendUrl + "/api/chat/send",
        {
          conversationId: currentChat._id,
          text: newMessage,
          userId: currentUser._id,
          userModel: "doctor"
        },
        { headers: { token: dToken } }
      );

      setMessages((prev) => [...prev, data]);

      socket.current.emit("send_message", data);

      setNewMessage("");

      setConversations((prev) =>
        prev.map((c) =>
          c._id === currentChat._id
            ? { ...c, lastMessage: data }
            : c
        )
      );

    } catch (err) {
      console.log(err);
    }
  };

  /* ================= CLEAR CHAT ================= */

  const handleClearConversation = async () => {

    try {

      await axios.delete(
        backendUrl + "/api/chat/clear/" + currentChat._id,
        {
          headers: { token: dToken },
          data: {
            userId: currentUser._id,
            userModel: "doctor"
          }
        }
      );

      setMessages([]);

      setConversations((prev) =>
        prev.map((c) =>
          c._id === currentChat._id
            ? { ...c, lastMessage: null }
            : c
        )
      );

      setShowMenu(false);

    } catch (err) {
      console.log(err);
    }

  };

  /* ================= DELETE SELECTED ================= */

  const handleDeleteSelected = async () => {

    try {

      for (let id of selectedMessages) {

        await axios.delete(
          backendUrl + "/api/chat/message/" + id,
          {
            headers:{ token: dToken },
            data: {
              userId: currentUser._id,
              userModel: "doctor"
            }
          }
        );

      }

     const updatedMessages = messages.filter(
        (m) => !selectedMessages.includes(m._id)
      );

      setMessages(updatedMessages);

      setConversations((prev) =>
        prev.map((c) =>
          c._id === currentChat._id
            ? { ...c, lastMessage: updatedMessages[updatedMessages.length - 1] || null }
            : c
        )
      );

      setSelectedMessages([]);
      setSelectMode(false);

    } catch (err) {
      console.log(err);
    }

  };

  const handleDeleteForEveryone = async () => {

    try {

      for (let id of selectedMessages) {

        await axios.delete(
          backendUrl + "/api/chat/message/" + id,
          {
            headers: { token: dToken },
            data: {
              userId: currentUser._id,
              userModel: "doctor"
            }
          }
        );

      }

      const updatedMessages = messages.filter(
        (m) => !selectedMessages.includes(m._id)
      );

      setMessages(updatedMessages);

      /* -------- UPDATE CONVERSATION LAST MESSAGE -------- */

      setConversations((prev) =>
        prev.map((c) =>
          c._id === currentChat._id
            ? {
                ...c,
                lastMessage:
                  updatedMessages.length > 0
                    ? updatedMessages[updatedMessages.length - 1]
                    : null,
              }
            : c
        )
      );

      setSelectedMessages([]);
      setSelectMode(false);

    } catch (err) {
      console.log(err);
    }

  };

  return (
    <div className="flex-1 flex flex-col">

      {/* ================= HEADER ================= */}

      <div className="flex items-center gap-3 p-4 border-b bg-gray-50">

        <img
          src={friend?.image || "/default-avatar.png"}
          className="w-10 h-10 rounded-full object-cover"
          alt="user"
        />

        <div>
          <p className="font-semibold">{friend?.name}</p>

          {onlineUsers.includes(friend?._id) && (
            <p className="text-xs text-green-500">Online</p>
          )}
        </div>

        {/* MENU */}

        <div className="ml-auto relative">

          <BsThreeDotsVertical
            size={18}
            className="cursor-pointer"
            onClick={() => setShowMenu(!showMenu)}
          />

          {showMenu && (
            <div className="absolute right-0 mt-2 w-44 bg-white shadow rounded-md z-50">

              <button
                className="flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-100"
                onClick={() => {
                  setSelectMode(true);
                  setShowMenu(false);
                }}
              >
                <FiCheckSquare /> Select Messages
              </button>

              <button
                className="flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-100"
                onClick={handleClearConversation}
              >
                <AiOutlineClear /> Clear Chat
              </button>

            </div>
          )}

        </div>
      </div>

      {/* ================= MESSAGES ================= */}

      <div className="flex-1 overflow-y-auto p-4 bg-gray-100">

        {messages.map((msg) => (
          <MessageBubble
            key={msg._id}
            message={msg}
            own={
              msg.sender?._id === currentUser._id ||
              msg.sender === currentUser._id
            }
            selectMode={selectMode}
            selected={selectedMessages.includes(msg._id)}
            onSelect={() => toggleSelect(msg._id)}
          />
        ))}

        <div ref={messagesEndRef}></div>

      </div>

      {/* ================= INPUT / ACTION BAR ================= */}

      {selectMode ? (

        <div className="flex items-center justify-between p-3 border-t bg-gray-200">

          <p className="font-semibold">
            {selectedMessages.length} selected
          </p>

          <div className="flex gap-4">

            {/* DELETE FOR ME */}

            <button
              onClick={handleDeleteSelected}
              disabled={selectedMessages.length === 0}
              className={`flex items-center gap-1 
                ${selectedMessages.length === 0
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-red-500"}`}
            >
              <MdDeleteOutline /> Delete for me
            </button>

            {/* DELETE FOR EVERYONE */}

            <button
              onClick={handleDeleteForEveryone}
              disabled={selectedMessages.length === 0}
              className={`flex items-center gap-1
                ${selectedMessages.length === 0
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-red-600"}`}
            >
              <MdDeleteOutline /> Delete for everyone
            </button>

            <button
              onClick={() => {
                setSelectMode(false);
                setSelectedMessages([]);
              }}
            >
              Cancel
            </button>

          </div>

        </div>

      ) : (

        <div className="flex p-3 border-t bg-white">

          <input
            type="text"
            placeholder="Type a message..."
            className="flex-1 border rounded-full px-4 py-2 focus:outline-none"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />

          <button
            onClick={handleSend}
            className="ml-3 bg-green-500 hover:bg-green-600 text-white px-5 rounded-full"
          >
            Send
          </button>

        </div>

      )}

    </div>
  );
};

export default ChatBox;