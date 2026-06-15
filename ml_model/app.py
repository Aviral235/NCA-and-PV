# ml_model/app.py
from flask_cors import CORS
from flask import Flask, request, jsonify
import pickle
import traceback
import re
import numpy as np

# Initialize Flask app
app = Flask(__name__)

# Allow all origins for local development and testing
CORS(app)

# Load model and vectorizer
try:
    with open("model.pkl", "rb") as model_file:
        model = pickle.load(model_file)

    with open("vectorizer.pkl", "rb") as vectorizer_file:
        vectorizer = pickle.load(vectorizer_file)

    print("Model and vectorizer loaded successfully.")
except Exception as e:
    print("Error loading model/vectorizer:", e)

def preprocess_text(text):
    if not text:
        return ""
    text = text.lower()
    text = re.sub(r'[^a-zA-Z0-9\s]', '', text) # Remove punctuation
    text = re.sub(r'\s+', ' ', text).strip()   # Remove extra whitespaces
    return text

# Helper to generate extractive 3-bullet-point summary (TL;DR)
def generate_tldr(text):
    sentences = re.split(r'(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\?)\s', text)
    sentences = [s.strip() for s in sentences if len(s.strip()) > 10]
    
    if len(sentences) <= 3:
        res = sentences
        while len(res) < 3:
            res.append("Detailed analysis of article content in progress.")
        return res[:3]
    
    words = re.sub(r'[^a-zA-Z\s]', '', text).lower().split()
    stop_words = {"the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "with", "by", "of", "is", "was", "were", "are", "that", "this", "it", "he", "she", "they", "as", "from", "at", "by", "about"}
    freq = {}
    for w in words:
        if w not in stop_words:
            freq[w] = freq.get(w, 0) + 1
            
    scored_sentences = []
    for i, s in enumerate(sentences):
        score = 0
        s_words = re.sub(r'[^a-zA-Z\s]', '', s).lower().split()
        for w in s_words:
            score += freq.get(w, 0)
        score = score / (1 + 0.1 * i)
        scored_sentences.append((score, s))
        
    scored_sentences.sort(key=lambda x: x[0], reverse=True)
    top_3 = scored_sentences[:3]
    top_3_sorted = sorted(top_3, key=lambda x: sentences.index(x[1]))
    return [x[1] for x in top_3_sorted]

# Helper to analyze political bias leanings
def analyze_bias(text):
    left_words = ["progressive", "systemic racism", "climate crisis", "reproductive rights", "undocumented", "universal healthcare", "inequality", "social justice", "diversity and inclusion", "lgbtq", "democrats", "biden", "harris"]
    right_words = ["conservative", "illegal alien", "tax cuts", "border security", "woke agenda", "traditional values", "free market", "second amendment", "religious freedom", "patriot", "republicans", "trump", "maga"]
    
    cleaned = text.lower()
    left_score = sum(cleaned.count(w) for w in left_words)
    right_score = sum(cleaned.count(w) for w in right_words)
    
    if left_score > right_score and left_score > 0:
        return "LEFT"
    elif right_score > left_score and right_score > 0:
        return "RIGHT"
    else:
        return "CENTER"

# Helper to calculate headline sensationalism vs text
def calculate_clickbait(headline, text):
    if not headline:
        return 10.0
    sensational_words = ["shocking", "unbelievable", "you wont believe", "revealed", "ruined", "secret", "exposed", "amazing", "worst", "best", "jaw-dropping", "miracle", "insane", "hiding"]
    cleaned_hl = re.sub(r'[^a-zA-Z0-9\s]', '', headline).lower()
    
    score = 15.0
    
    if "?" in headline or "!" in headline:
        score += 20.0
        
    for w in sensational_words:
        if w in cleaned_hl:
            score += 25.0
            
    hl_words = headline.split()
    caps_words = [w for w in hl_words if w.isupper() and len(w) > 1]
    if caps_words:
        score += 15.0
        
    hl_clean_words = [w for w in cleaned_hl.split() if len(w) > 3]
    if hl_clean_words:
        text_clean = text.lower()
        found_count = sum(1 for w in hl_clean_words if w in text_clean)
        overlap_ratio = found_count / len(hl_clean_words)
        if overlap_ratio < 0.4:
            score += 25.0
            
    return round(min(100.0, max(0.0, score)), 2)

# Default route
@app.route('/')
def home():
    return "✅ News Credibility Predictor API is running!"

# Prediction route
@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        news_text = data.get("text", "")
        headline = data.get("headline", "")

        if not news_text:
            return jsonify({"error": "No text provided."}), 400

        # Preprocess text before prediction to match training data
        cleaned_text = preprocess_text(news_text)
        transformed_text = vectorizer.transform([cleaned_text])

        # Predict
        prediction = model.predict(transformed_text)[0]
        
        # Calculate confidence dynamically depending on model support
        if hasattr(model, "predict_proba"):
            confidence = model.predict_proba(transformed_text)[0].max()
        elif hasattr(model, "decision_function"):
            decision = model.decision_function(transformed_text)[0]
            confidence = 1 / (1 + np.exp(-abs(decision)))
        else:
            confidence = 1.0

        # Generate NLP Analytics
        tldr = generate_tldr(news_text)
        bias = analyze_bias(news_text)
        clickbait_score = calculate_clickbait(headline, news_text)

        result = {
            "prediction": "REAL" if prediction == 1 else "FAKE",
            "confidence": round(float(confidence), 4),
            "bias": bias,
            "clickbait_score": clickbait_score,
            "tldr": tldr
        }
        return jsonify(result)

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

# Run the app
if __name__ == '__main__':
    app.run(debug=True, port=5000)
