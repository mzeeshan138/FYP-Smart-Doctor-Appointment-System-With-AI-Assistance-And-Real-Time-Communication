const ConversationList = ({
  conversations,
  currentUser,
  setCurrentChat,
  onlineUsers,
}) => {
  return (
    <div className="w-80 border-r bg-white overflow-y-auto">
      {conversations.map((c) => {

        const friend =
          currentUser._id === c.userId?._id ? c.docId : c.userId;

        return (
          <div
            key={c._id}
            onClick={() => setCurrentChat(c)}
            className="flex items-center gap-3 p-4 border-b cursor-pointer hover:bg-gray-100"
          >
            <div className="relative">
              <img
                src={friend?.image || "/default-avatar.png"}
                className="w-10 h-10 rounded-full object-cover"
                alt="user"
              />

              {onlineUsers.includes(friend?._id) && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
              )}
            </div>

            <div>
              <p className="font-semibold">{friend?.name}</p>

              <p className="text-xs text-gray-500 truncate max-w-[180px]">
                {c.lastMessage?.text || "Start conversation"}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ConversationList;