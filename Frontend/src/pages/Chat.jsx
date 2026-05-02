import { useContext } from "react";
import { AppContext } from "../context/AppContext";
import ChatLayout from "../components/chat/ChatLayout";

const Chat = () => {
  const { userData, token } = useContext(AppContext);

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Please login first.
      </div>
    );
  }

  return (
    <div className="bg-gray-100">
      <ChatLayout currentUser={userData} />
    </div>
  );
};

export default Chat;