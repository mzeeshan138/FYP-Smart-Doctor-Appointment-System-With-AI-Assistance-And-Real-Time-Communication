import { BsCheck, BsCheckAll } from "react-icons/bs";
const MessageBubble = ({
  message,
  own,
  selectMode,
  selected,
  onSelect
}) => {
  const isSeen =
  own &&
  message.seenByModel &&
  message.senderModel !== message.seenByModel;

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

        <p className="text-[11px] mt-1 flex items-center justify-end gap-1">
          <span className="opacity-70">
            {new Date(message.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit"
            })}
          </span>

          {own && (
            isSeen ? (
              <BsCheckAll className="text-blue-600 text-lg" />
            ) : (
              <BsCheck className="text-white text-lg opacity-90" />
            )
          )}
      </p>

      </div>
    </div>
  );
};

export default MessageBubble;