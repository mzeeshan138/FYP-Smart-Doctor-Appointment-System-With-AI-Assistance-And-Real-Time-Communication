import { useContext, useEffect } from "react";
import { DoctorContext } from "../context/DontorContext";
import ChatLayout from "../components/chat/ChatLayout";


const Chat = () => {
  const { profileData, dToken, getProfileData } = useContext(DoctorContext);

  useEffect(() => {
    if (dToken && !profileData) {
      getProfileData();
    }
  }, [dToken,profileData,getProfileData]);

  // console.log("doc", profileData);

  if (!dToken) {
    return <div>Please login first.</div>;
  }

  // // ⛔ WAIT until profile loads
  // if (!profileData) {
  //   return <div>Loading...</div>;
  // }

  return (
    <div className="bg-gray-100">
      <ChatLayout currentUser={profileData} />
    </div>
  );
};

export default Chat;