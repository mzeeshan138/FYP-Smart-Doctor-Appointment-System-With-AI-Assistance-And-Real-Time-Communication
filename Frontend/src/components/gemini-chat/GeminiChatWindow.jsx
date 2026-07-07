import { useState, useRef, useEffect, useContext } from "react";
import axios from "axios";
import PropTypes from "prop-types";
import { AppContext } from "../../context/AppContext";
import DoctorCard from "./DoctorCard";

export default function GeminiChatWindow({ onClose }) {
  const { backendUrl } = useContext(AppContext);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);
    const userText = input;
    setInput("");
    setLoading(true);

    try {
      const res = await axios.post(backendUrl + "/api/gemini-ai/chat", {
        message: userText,
      });

      if (!res.data.success) {
        setMessages((prev) => [
          ...prev,
          {
            sender: "bot",
            text: res.data.message || "Sorry, something went wrong.",
          },
        ]);
        return;
      }

      const {
        has_valid_symptoms,
        detected_symptoms,
        predicted_disease,
        assistant_message,
        doctors,
      } = res.data;

      if (assistant_message) {
        setMessages((prev) => [
          ...prev,
          { sender: "bot", type: "assistant", text: assistant_message },
        ]);
      }

      if (has_valid_symptoms === false) {
        return;
      }

      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          type: "disease",
          detected_symptoms,
          predicted_disease,
        },
      ]);

      if (doctors && doctors.length > 0) {
        setMessages((prev) => [
          ...prev,
          { sender: "bot", type: "doctors", doctors },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { sender: "bot", type: "no-doctor" },
        ]);
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text:
            err.response?.data?.message ||
            "Sorry, something went wrong. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => setMessages([]);

  return (
    <div className="fixed top-10 right-6 w-[380px] h-[550px] bg-white rounded-xl shadow-2xl flex flex-col z-50 animate-slideDown">
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
          }

          if (msg.type === "assistant") {
            return (
              <div key={i} className="text-left">
                <div className="inline-block bg-blue-50 border-l-4 border-blue-500 px-3 py-2 rounded-lg">
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">
                    {msg.text}
                  </p>
                </div>
              </div>
            );
          }

          if (msg.type === "disease") {
            return (
              <div key={i} className="text-left space-y-1">
                <div className="inline-block bg-red-100 border-l-4 border-red-500 px-3 py-2 rounded-lg">
                  <p className="font-semibold text-red-700">
                    Possible Condition: {msg.predicted_disease}
                  </p>
                  <p className="text-gray-700 text-sm">
                    Symptoms: {msg.detected_symptoms?.join(", ")}
                  </p>
                </div>
              </div>
            );
          }

          if (msg.type === "doctors") {
            return (
              <div key={i} className="space-y-2">
                {msg.doctors.map((doc) => (
                  <DoctorCard key={doc._id} doctor={doc} />
                ))}
              </div>
            );
          }

          if (msg.type === "no-doctor") {
            return (
              <div key={i} className="text-left">
                <div className="inline-block bg-yellow-100 border-l-4 border-yellow-500 px-3 py-2 rounded-lg">
                  <p className="font-semibold text-yellow-700">
                    🚫 No matching doctors available right now.
                  </p>
                  <p className="text-sm text-gray-600">
                    Please try again later or browse doctors manually.
                  </p>
                </div>
              </div>
            );
          }

          return (
            <div key={i} className="text-left">
              <span className="inline-block bg-gray-200 px-3 py-2 rounded-lg">
                {msg.text}
              </span>
            </div>
          );
        })}

        {loading && (
          <div className="text-gray-400 text-sm">AI is typing...</div>
        )}

        <div ref={chatEndRef} />
      </div>

      <div className="p-2 border-t flex">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Describe your problem or ask for help..."
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

GeminiChatWindow.propTypes = {
  onClose: PropTypes.func.isRequired,
};
