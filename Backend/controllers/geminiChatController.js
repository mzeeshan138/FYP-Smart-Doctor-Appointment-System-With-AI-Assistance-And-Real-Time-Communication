import { GoogleGenerativeAI } from "@google/generative-ai";
import doctorModel from "../models/doctorModel.js";

const buildDoctorContext = (doctors) =>
  doctors
    .map(
      (d) =>
        `- id: ${d._id} | name: ${d.name} | speciality: ${d.speciality} | experience: ${d.experience} | fees: ${d.fees}`
    )
    .join("\n");

const parseGeminiJson = (text) => {
  const cleaned = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start === -1 || end === -1) {
    throw new Error("Gemini did not return valid JSON");
  }

  return JSON.parse(cleaned.slice(start, end + 1));
};

const resolveMatchedDoctors = (doctors, parsed) => {
  const recommendedIds = Array.isArray(parsed.recommended_doctor_ids)
    ? parsed.recommended_doctor_ids.map(String)
    : [];
  const recommendedSpeciality = parsed.recommended_speciality?.trim();

  let matched = doctors.filter((d) =>
    recommendedIds.includes(String(d._id))
  );

  if (recommendedSpeciality) {
    matched = matched.filter(
      (d) =>
        d.speciality?.toLowerCase() === recommendedSpeciality.toLowerCase()
    );

    if (matched.length === 0) {
      matched = doctors.filter(
        (d) =>
          d.speciality?.toLowerCase() === recommendedSpeciality.toLowerCase()
      );
    }
  } else if (matched.length > 0) {
    const targetSpeciality = matched[0].speciality;
    matched = matched.filter((d) => d.speciality === targetSpeciality);
  }

  return matched.slice(0, 1);
};

const geminiChatHandler = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message?.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Message is required" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: "API_KEY is not configured on the server",
      });
    }

    const doctors = await doctorModel
      .find({ available: true })
      .select("-password -email");

    const doctorContext = buildDoctorContext(doctors);

    const prompt = `You are a helpful medical triage assistant for DoctorHub — an online doctor appointment platform.

The user may describe symptoms, health problems, or ask for help in natural language. Analyze their message and respond ONLY with valid JSON (no markdown, no extra text).

Available doctors in our system:
${doctorContext || "No doctors currently available."}

Your tasks:
1. Understand what the user said (symptoms, concerns, or questions).
2. Identify detected_symptoms from their message.
3. Suggest a possible_condition (not a definitive diagnosis — use phrases like "possible" or "may indicate").
4. Decide recommended_speciality: the ONE best speciality for this case (e.g. "Neurologist", "General physician", "Dermatologist"). Use exact speciality names from the doctor list above.
5. Write assistant_message: a warm 3-5 sentence reply that:
   - Acknowledges what they told you ("You mentioned...")
   - Summarizes the possible condition in plain language
   - Gives practical guidance (rest, hydration, when to see a doctor, etc.)
   - If recommending a doctor, mention they can book that doctor below
   - If no doctor is available for that speciality, clearly say no matching doctor is available right now
   - Never claim to be a doctor or give a final diagnosis
6. Pick recommended_doctor_ids: return ONLY 0 or 1 doctor id.
   - Choose the single best doctor from the list whose speciality exactly matches recommended_speciality.
   - Never mix specialities. Never return a General physician and a Neurologist together.
   - If no doctor with that speciality exists in the list, return [] — do NOT suggest doctors from other specialities.

User message:
"${message.replace(/"/g, '\\"')}"

Respond with this exact JSON shape:
{
  "detected_symptoms": ["symptom1", "symptom2"],
  "possible_condition": "Possible condition name",
  "recommended_speciality": "Neurologist",
  "assistant_message": "Your full guidance message for the patient.",
  "recommended_doctor_ids": ["single_doctor_id_or_empty"]
}`;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    });

    const result = await model.generateContent(prompt);
    const rawText = result.response.text();
    const parsed = parseGeminiJson(rawText);

    const detected_symptoms = Array.isArray(parsed.detected_symptoms)
      ? parsed.detected_symptoms
      : [];
    const predicted_disease =
      parsed.possible_condition || parsed.predicted_disease || "Unknown";
    const assistant_message =
      parsed.assistant_message ||
      "Thank you for sharing. Please consult a doctor for a proper evaluation.";

    const matchedDoctors = resolveMatchedDoctors(doctors, parsed);

    res.status(200).json({
      success: true,
      detected_symptoms,
      predicted_disease,
      assistant_message,
      doctors: matchedDoctors,
    });
  } catch (error) {
    console.log("Chat Error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message || "AI Chat failed",
    });
  }
};

export { geminiChatHandler };
