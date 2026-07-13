import { useState, useRef, useEffect } from "react";
import axios from "axios";
import DoctorCard from "./DoctorCard";
import PropTypes from "prop-types";
import { SYMPTOMS } from "../../constants/constants";

export default function AIChatWindow({ onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Scroll to bottom when new message arrives
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // ✅ Count matched symptoms from user text
  const getMatchedSymptoms = (text) => {
    const lowerText = text.toLowerCase();

    return SYMPTOMS.filter((s) => {
      const phrase = s.replace(/_/g, " ");
      const regex = new RegExp(`\\b${phrase}\\b`, "i");
      return regex.test(lowerText);
    });
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

  // ✅ Check symptom before API call
  const matchedSymptoms = getMatchedSymptoms(input);

  // ❌ No valid symptom
  if (matchedSymptoms.length === 0) {
    setMessages((prev) => [
      ...prev,
      {
        sender: "bot",
        text: "⚠ Please enter valid symptoms like high fever, headache, cough etc.",
      },
    ]);
    return;
  }

  // ❌ Less than 3 symptoms
  if (matchedSymptoms.length < 3) {
    setMessages((prev) => [
      ...prev,
      {
        sender: "bot",
        text: "⚠ Please enter at least 3 different symptoms for accurate prediction.",
      },
    ]);
    return;
  }

    setLoading(true);

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || window.location.origin;
      const res = await axios.post(
        `${backendUrl}/api/ai/chat`,
        { message: input }
      );

      const { detected_symptoms, predicted_disease, doctors } = res.data;

      // Disease message
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          type: "disease",
          detected_symptoms,
          predicted_disease,
        },
      ]);

      // Doctors message
      if (doctors && doctors.length > 0) {
        setMessages((prev) => [
          ...prev,
          { sender: "bot", type: "doctors", doctors },
        ]);
      } else {
        // ✅ No doctors found
        setMessages((prev) => [
          ...prev,
          { sender: "bot", type: "no-doctor" },
        ]);
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "Sorry, something went wrong 😕" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => setMessages([]);

  return (
    <div className="fixed top-10 right-6 w-[380px] h-[550px] bg-white rounded-xl shadow-2xl flex flex-col z-50 animate-slideDown">
      {/* Header */}
      <div className="bg-blue-600 text-white p-3 rounded-t-xl flex justify-between items-center">
        <span className="font-semibold">AI Health Assistant</span>
        <div className="space-x-2">
          <button onClick={clearChat} className="hover:bg-blue-500 px-2 rounded">
            🧹
          </button>
          <button onClick={onClose} className="hover:bg-blue-500 px-2 rounded">
            ✖
          </button>
        </div>
      </div>

      {/* Chat Body */}
      <div className="flex-1 p-3 overflow-y-auto space-y-3">
        {messages.map((msg, i) => {
          if (msg.sender === "user") {
            return (
              <div key={i} className="text-right">
                <span className="inline-block bg-blue-500 text-white px-3 py-2 rounded-lg">
                  {msg.text}
                </span>
              </div>
            );
          } else if (msg.type === "disease") {
            return (
              <div key={i} className="text-left space-y-1">
                <div className="inline-block bg-red-100 border-l-4 border-red-500 px-3 py-2 rounded-lg">
                  <p className="font-semibold text-red-700">
                    Predicted Disease: {msg.predicted_disease}
                  </p>
                  <p className="text-gray-700 text-sm">
                    Symptoms: {msg.detected_symptoms.join(", ")}
                  </p>
                </div>
              </div>
            );
          } else if (msg.type === "doctors") {
            return (
              <div key={i} className="space-y-2">
                {msg.doctors.map((doc) => (
                  <DoctorCard key={doc._id} doctor={doc} />
                ))}
              </div>
            );
          } else if (msg.type === "no-doctor") {
            return (
              <div key={i} className="text-left">
                <div className="inline-block bg-yellow-100 border-l-4 border-yellow-500 px-3 py-2 rounded-lg">
                  <p className="font-semibold text-yellow-700">
                    🚫 No doctors found for this disease.
                  </p>
                  <p className="text-sm text-gray-600">
                    Please try another symptom or check later.
                  </p>
                </div>
              </div>
            );
          } else {
            return (
              <div key={i} className="text-left">
                <span className="inline-block bg-gray-200 px-3 py-2 rounded-lg">
                  {msg.text}
                </span>
              </div>
            );
          }
        })}

        {loading && (
          <div className="text-gray-400 text-sm">AI is typing...</div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="p-2 border-t flex">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your symptoms..."
          className="flex-1 border rounded-l-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button
          onClick={sendMessage}
          className="bg-blue-600 text-white px-4 rounded-r-lg hover:bg-blue-700 transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  );
}

AIChatWindow.propTypes = {
  onClose: PropTypes.func.isRequired,
};