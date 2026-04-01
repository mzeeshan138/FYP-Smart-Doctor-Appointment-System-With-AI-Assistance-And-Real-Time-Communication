const MessageBubble = ({
  message,
  own,
  selectMode,
  selected,
  onSelect
}) => {

  return (
    <div
      className={`flex mb-3 items-center gap-2
      ${own ? "justify-end" : "justify-start"}`}
    >

      {/* Checkbox only in select mode */}

      {selectMode && (
        <input
          type="checkbox"
          checked={selected}
          onChange={onSelect}
          className="w-4 h-4 cursor-pointer"
        />
      )}

      <div
        onClick={() => selectMode && onSelect()}
        className={`px-4 py-2 rounded-xl shadow max-w-xs cursor-pointer
        ${own ? "bg-green-500 text-white" : "bg-white"}
        ${selected ? "border-2 border-blue-500" : ""}`}
      >

        <p>{message.text}</p>

        <p className="text-[10px] mt-1 opacity-70 text-right">
          {new Date(message.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
          })}
        </p>

      </div>
    </div>
  );
};

export default MessageBubble;