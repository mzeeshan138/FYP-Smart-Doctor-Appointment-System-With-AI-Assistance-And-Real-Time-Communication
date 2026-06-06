import { useState } from "react";
import GeminiChatWindow from "./GeminiChatWindow";

export default function GeminiChatWidget() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 bg-blue-600 text-white w-16 h-16 rounded-full shadow-lg text-3xl z-50 hover:scale-110 transition-transform"
        >
          🤖
        </button>
      )}

      {open && <GeminiChatWindow onClose={() => setOpen(false)} />}
    </>
  );
}
