import { useContext, useEffect } from "react";
import { DoctorContext } from "../context/DoctorContext";
import ChatLayout from "../components/chat/ChatLayout";

const Chat = () => {
  const { profileData, dToken, getProfileData } = useContext(DoctorContext);

  useEffect(() => {
    if (dToken) {
      getProfileData();
    }
  }, [dToken, getProfileData]);

  if (!dToken) {
    return (
      <div className="p-8 text-gray-500">Please login as a doctor to use chat.</div>
    );
  }

  if (!profileData) {
    return (
      <div className="p-8 text-gray-500">Loading chat...</div>
    );
  }

  return (
    <div className="w-full h-[calc(100vh-64px)] bg-gray-100 overflow-hidden">
      <ChatLayout currentUser={profileData} />
    </div>
  );
};

export default Chat;
