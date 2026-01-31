import { useState } from "react";
import axios from "axios";
import DoctorCard from "./DoctorCard";

export default function AIChatWindow({ onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = { sender: "user", text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      // 🔹 Single call to Node.js
      const res = await axios.post("http://localhost:4000/api/ai/chat", { message: input });
      const { detected_symptoms, predicted_disease, doctors } = res.data;

      // 🔹 Bot message for predicted disease
      setMessages(prev => [
        ...prev,
        {
          sender: "bot",
          text: `Based on your symptoms (${detected_symptoms.join(", ")}), you should consult a ${predicted_disease}.`,
        },
      ]);

      // 🔹 Bot message for doctors
      if (doctors && doctors.length > 0) {
        setMessages(prev => [
          ...prev,
          { sender: "bot", doctors },
        ]);
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { sender: "bot", text: "Sorry, something went wrong 😕" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => setMessages([]);

  return (
    <div className="fixed bottom-20 right-6 w-[360px] h-[520px] bg-white rounded-xl shadow-2xl flex flex-col z-50">
      {/* Header */}
      <div className="bg-blue-600 text-white p-3 rounded-t-xl flex justify-between items-center">
        <span>AI Health Assistant</span>
        <div className="space-x-2">
          <button onClick={clearChat}>🧹</button>
          <button onClick={onClose}>✖</button>
        </div>
      </div>

      {/* Chat Body */}
      <div className="flex-1 p-3 overflow-y-auto space-y-2">
        {messages.map((msg, i) =>
          msg.sender === "user" ? (
            <div key={i} className="text-right">
              <span className="inline-block bg-blue-500 text-white px-3 py-2 rounded-lg">
                {msg.text}
              </span>
            </div>
          ) : msg.text ? (
            <div key={i} className="text-left">
              <span className="inline-block bg-gray-200 px-3 py-2 rounded-lg">
                {msg.text}
              </span>
            </div>
          ) : (
            <div key={i} className="space-y-2">
              {msg.doctors.map(doc => (
                <DoctorCard key={doc._id} doctor={doc} />
              ))}
            </div>
          )
        )}

        {loading && <div className="text-gray-400 text-sm">AI is typing...</div>}
      </div>

      {/* Input */}
      <div className="p-2 border-t flex">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type your symptoms..."
          className="flex-1 border rounded-l-lg px-3 py-2 outline-none"
        />
        <button onClick={sendMessage} className="bg-blue-600 text-white px-4 rounded-r-lg">
          Send
        </button>
      </div>
    </div>
  );
}
