const MessageBubble = ({ message, own }) => {
  return (
    <div className={`flex mb-3 ${own ? "justify-end" : "justify-start"}`}>
      <div
        className={`px-4 py-2 rounded-xl shadow max-w-xs ${
          own ? "bg-green-500 text-white" : "bg-white"
        }`}
      >
        <p>{message.text}</p>

        <p className="text-[10px] mt-1 opacity-70 text-right">
          {new Date(message.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
};

export default MessageBubble;