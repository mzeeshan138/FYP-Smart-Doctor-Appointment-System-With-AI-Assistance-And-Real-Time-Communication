import axios from "axios";
import doctorModel from "../models/doctorModel.js";

const aiChatHandler = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ success: false, message: "Message is required" });

    // 🔹 Call FastAPI internally
    const aiRes = await axios.post("http://127.0.0.1:8000/predict", { text: message });
    const { detected_symptoms, predicted_disease } = aiRes.data;

    // 🔹 Map disease → speciality
    const diseaseToSpeciality = {
      "Cervical spondylosis": "Orthopedic",
      "Heart attack": "Cardiologist",
      "Chest Pain": "Cardiologist",
      "Skin Infection": "Dermatologist",
      "Acne": "Dermatologist",
      "Malaria": "General physician",
      "Fever": "General Physician",
      "Cold & Flu": "ENT Specialist",
    };

    const speciality = diseaseToSpeciality[predicted_disease] || predicted_disease;

    // 🔹 Fetch available doctors
    const doctors = await doctorModel.find({ speciality, available: true }).select("-password -email");

    // 🔹 Send all data to frontend
    res.status(200).json({
      success: true,
      detected_symptoms,
      predicted_disease,
      speciality,
      doctors,
    });
  } catch (error) {
    console.log("AI Chat Error:", error.message);
    res.status(500).json({ success: false, message: "AI Chat failed" });
  }
};

export { aiChatHandler };
