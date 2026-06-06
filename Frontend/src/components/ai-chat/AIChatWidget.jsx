// Old AI chat (FastAPI) — enable in Home.jsx to use this instead of Gemini
import { useState } from "react";
import AIChatWindow from "./AIChatWindow";

export default function AIChatWidget() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Floating Button (Hide when chat open) */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 bg-blue-600 text-white w-16 h-16 rounded-full shadow-lg text-3xl z-50 hover:scale-110 transition-transform"
        >
          🤖
        </button>
      )}

      {/* Chat Window */}
      {open && <AIChatWindow onClose={() => setOpen(false)} />}
    </>
  );
}
