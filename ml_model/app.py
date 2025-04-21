from flask_cors import CORS
from flask import Flask, request, jsonify
import pickle
import traceback

# Initialize Flask app
app = Flask(__name__)

CORS(app, origins=["http://127.0.0.1:5501"])
# Load model and vectorizer
try:
    with open("model.pkl", "rb") as model_file:
        model = pickle.load(model_file)

    with open("vectorizer.pkl", "rb") as vectorizer_file:
        vectorizer = pickle.load(vectorizer_file)

    print("Model and vectorizer loaded successfully.")
except Exception as e:
    print("Error loading model/vectorizer:", e)

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

        if not news_text:
            return jsonify({"error": "No text provided."}), 400

        # Transform text
        transformed_text = vectorizer.transform([news_text])

        # Predict
        prediction = model.predict(transformed_text)[0]
        confidence = model.predict_proba(transformed_text)[0].max()

        result = {
            "prediction": "REAL" if prediction == 1 else "FAKE",
            "confidence": round(float(confidence), 4)
        }
        return jsonify(result)

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

# Run the app
if __name__ == '__main__':
    app.run(debug=True)
