import { useState } from "react";
import AIChatWindow from "./AIChatWindow";

export default function AIChatWidget() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 bg-blue-600 text-white w-14 h-14 rounded-full shadow-lg text-2xl z-50"
      >
        🤖
      </button>

      {open && <AIChatWindow onClose={() => setOpen(false)} />}
    </>
  );
}
