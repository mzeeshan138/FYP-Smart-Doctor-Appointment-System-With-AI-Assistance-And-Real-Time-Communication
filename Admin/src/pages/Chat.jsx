import { useContext } from "react";
import { AppContext } from "../context/AppContext";
import { DoctorContext } from "../context/DontorContext";
import ChatLayout from "../components/chat/ChatLayout";

const Chat = () => {
  // const { userData, dToken } = useContext(AppContext);
  const { userData, dToken } = useContext(DoctorContext);

  if (!dToken) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Please login first.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <ChatLayout currentUser={userData} />
    </div>
  );
};

export default Chat;