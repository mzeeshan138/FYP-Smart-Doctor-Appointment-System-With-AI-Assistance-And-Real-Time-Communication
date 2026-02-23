from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import pickle
import re

app = FastAPI(title="Disease Prediction API")

# Enable CORS so React can call FastAPI
origins = [
    "http://localhost:3000",  # React dev server
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,        # who can access
    allow_credentials=True,
    allow_methods=["*"],          # allow POST, OPTIONS, etc.
    allow_headers=["*"],          # allow all headers
)

# Load model and symptoms
model = pickle.load(open("disease_model.pkl", "rb"))
symptoms = pickle.load(open("symptoms.pkl", "rb"))

def extract_symptoms(text):
    text = text.lower()
    detected = []
    for s in symptoms:
        phrase = s.replace("_", " ")
        if re.search(r"\b" + re.escape(phrase) + r"\b", text):
            detected.append(s)
    return list(set(detected))

@app.post("/predict")
def predict(data: dict):
    user_text = data["text"]
    detected = extract_symptoms(user_text)
    input_vector = [1 if s in detected else 0 for s in symptoms]
    disease = model.predict([input_vector])[0]
    return {
        "detected_symptoms": detected,
        "predicted_disease": disease
    }
