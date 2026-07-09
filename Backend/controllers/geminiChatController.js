import { GoogleGenerativeAI } from "@google/generative-ai";
import doctorModel from "../models/doctorModel.js";

const SPECIALITY_NAMES = [
  "General physician",
  "Gynecologist",
  "Dermatologist",
  "Pediatricians",
  "Neurologist",
  "Gastroenterologist",
];

const buildDoctorContext = (doctors) =>
  doctors
    .map(
      (d) =>
        `- id: ${d._id} | name: ${d.name} | speciality: ${d.speciality} | experience: ${d.experience} | fees: ${d.fees}`
    )
    .join("\n");

const NON_SYMPTOM_PATTERNS = [
  /^(hi+|hello+|hey+|hola+|yo+|sup+|good\s+(morning|afternoon|evening|night))[\s!.?]*$/i,
  /^(thanks|thank\s+you|ok|okay|bye|goodbye)[\s!.?]*$/i,
  /\b(no\s+(symptoms?|issues?|problems?|pain|concerns?)|nothing\s+wrong|i\s?(?:'m| am)\s+fine|i\s+have\s+no\s+(symptoms?|issues?|problems?))\b/i,
  /\b(just\s+saying\s+hi|only\s+saying\s+hi|how\s+are\s+you)\b/i,
];

const isNonSymptomMessage = (message) => {
  const trimmed = message.trim();
  if (!trimmed) return true;
  return NON_SYMPTOM_PATTERNS.some((pattern) => pattern.test(trimmed));
};

const buildNoSymptomsResponse = () => ({
  success: true,
  has_valid_symptoms: false,
  detected_symptoms: [],
  predicted_disease: "",
  assistant_message:
    "Hello! I'm here to help with health concerns. Please describe your actual symptoms — for example: fever, headache, cough, stomach pain, rash, or fatigue — so I can suggest a possible condition and recommend a doctor.",
  doctors: [],
});

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

    if (isNonSymptomMessage(message)) {
      return res.status(200).json(buildNoSymptomsResponse());
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
    const specialityList = SPECIALITY_NAMES.map((s) => `- ${s}`).join("\n");

    const prompt = `You are a helpful medical triage assistant for DoctorHub — an online doctor appointment platform.

The user may describe symptoms, health problems, or ask for help in natural language. Analyze their message and respond ONLY with valid JSON (no markdown, no extra text).

IMPORTANT — detect messages with NO valid symptoms:
Set has_valid_symptoms to false when the message is ANY of these:
- Only a greeting or small talk (e.g. "hi", "hello", "hey", "good morning", "how are you")
- Says they have no symptoms, no issue, or nothing wrong (e.g. "I'm fine", "no problem", "no symptoms")
- Does not describe any actual health symptom, pain, or medical concern
- Unrelated chit-chat with no health information

When has_valid_symptoms is false:
- detected_symptoms must be []
- possible_condition must be ""
- recommended_speciality must be ""
- recommended_doctor_ids must be []
- assistant_message must politely ask the user to enter valid symptoms (e.g. fever, headache, cough, stomach pain, rash, fatigue). Do NOT guess a condition or recommend a doctor.

Only set has_valid_symptoms to true when the user clearly describes at least one concrete health symptom or medical concern.

Available specialities (categories) — pick exactly ONE only when has_valid_symptoms is true. Copy the name exactly as written:
${specialityList}

Available doctors in our system:
${doctorContext || "No doctors currently available."}

When has_valid_symptoms is true, your tasks:
1. Identify detected_symptoms from their message.
2. Suggest a possible_condition (not a definitive diagnosis — use phrases like "possible" or "may indicate").
3. Decide recommended_speciality: the ONE best category from the specialities list above.
4. Write assistant_message: a warm 3-5 sentence reply that:
   - Acknowledges what they told you ("You mentioned...")
   - Summarizes the possible condition in plain language
   - Gives practical guidance (rest, hydration, when to see a doctor, etc.)
   - If recommending a doctor, mention they can book that doctor below
   - If no doctor is available for that speciality, clearly say no matching doctor is available right now
   - Never claim to be a doctor or give a final diagnosis
5. Pick recommended_doctor_ids: return ONLY 0 or 1 doctor id.
   - Choose the single best doctor from the list whose speciality exactly matches recommended_speciality.
   - Never mix specialities.
   - If no doctor with that speciality exists in the list, return [].

User message:
"${message.replace(/"/g, '\\"')}"

Respond with this exact JSON shape:
{
  "has_valid_symptoms": true,
  "detected_symptoms": ["symptom1", "symptom2"],
  "possible_condition": "Possible condition name",
  "recommended_speciality": "Neurologist",
  "assistant_message": "Your full guidance message for the patient.",
  "recommended_doctor_ids": ["single_doctor_id_or_empty"]
}`;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL,
    });

    const result = await model.generateContent(prompt);
    const rawText = result.response.text();
    const parsed = parseGeminiJson(rawText);

    const hasValidSymptoms = parsed.has_valid_symptoms !== false;
    const detected_symptoms = Array.isArray(parsed.detected_symptoms)
      ? parsed.detected_symptoms
      : [];
    const predicted_disease =
      parsed.possible_condition || parsed.predicted_disease || "Unknown";
    const assistant_message =
      parsed.assistant_message ||
      "Thank you for sharing. Please consult a doctor for a proper evaluation.";

    if (!hasValidSymptoms || detected_symptoms.length === 0) {
      return res.status(200).json({
        success: true,
        has_valid_symptoms: false,
        detected_symptoms: [],
        predicted_disease: "",
        assistant_message:
          assistant_message ||
          buildNoSymptomsResponse().assistant_message,
        doctors: [],
      });
    }

    const matchedDoctors = resolveMatchedDoctors(doctors, parsed);

    res.status(200).json({
      success: true,
      has_valid_symptoms: true,
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
