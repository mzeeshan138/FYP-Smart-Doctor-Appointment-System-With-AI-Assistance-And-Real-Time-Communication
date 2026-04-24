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
    // General Physician
    "Fungal infection": "General physician",
    "Allergy": "General physician",
    "Drug Reaction": "General physician",
    "AIDS": "General physician",
    "Diabetes": "General physician",
    "Gastroenteritis": "General physician",
    "Hypertension": "General physician",
    "Jaundice": "General physician",
    "Malaria": "General physician",
    "Dengue": "General physician",
    "Typhoid": "General physician",
    "Tuberculosis": "General physician",
    "Common Cold": "General physician",
    "Pneumonia": "General physician",
    "Hypothyroidism": "General physician",
    "Hyperthyroidism": "General physician",
    "Hypoglycemia": "General physician",

    // Gastroenterologist
    "GERD": "Gastroenterologist",
    "Chronic cholestasis": "Gastroenterologist",
    "Peptic ulcer diseae": "Gastroenterologist",
    "hepatitis A": "Gastroenterologist",
    "Hepatitis B": "Gastroenterologist",
    "Hepatitis C": "Gastroenterologist",
    "Hepatitis D": "Gastroenterologist",
    "Hepatitis E": "Gastroenterologist",
    "Alcoholic hepatitis": "Gastroenterologist",
    "Dimorphic hemmorhoids(piles)": "Gastroenterologist",

    // Dermatologist
    "Acne": "Dermatologist",
    "Psoriasis": "Dermatologist",
    "Impetigo": "Dermatologist",

    // Neurologist
    "Migraine": "Neurologist",
    "Paralysis (brain hemorrhage)": "Neurologist",
    "(vertigo) Paroymsal  Positional Vertigo": "Neurologist",

    // Pediatricians
    "Chicken pox": "Pediatricians",

    // Gynecologist
    "Urinary tract infection": "Gynecologist"
  };

    const speciality = diseaseToSpeciality[predicted_disease] || predicted_disease;

    // 🔹 Fetch available doctors
    const doctors = await doctorModel.find({ speciality, available: true }).select("-password -email");
    //doctorModel.find({ speciality: speciality, available: true })

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
