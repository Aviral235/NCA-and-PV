# News Credibility Analyser & Profanity Validator

An AI-powered web application to analyze the credibility of news articles and scan text or documents for profanity and offensive language.

---

## Project Structure

The project has been restructured for optimal division of concerns:

```
├── backend/                  # Node.js Express Backend
│   ├── models/               # MongoDB Schemas (User models)
│   ├── routes/               # REST API Routers (Auth, News Proxy, Profanity)
│   ├── utils/                # Utility helpers & Blacklists
│   ├── index.js              # Server entry point
│   └── DATABASE_GUIDE.md     # Database configuration and admin guide
├── frontend/                 # Client UI (served statically on http://localhost:8080)
│   ├── assets/               # Images and visual components
│   ├── index.html            # Landing / Home page
│   ├── dashboard.html        # Main User Dashboard (News feed)
│   ├── login.html            # Login screen
│   ├── signup.html           # Signup screen
│   ├── profile.html          # Profile settings and update page
│   ├── analyze.html          # News credibility analyzer UI
│   └── profanity.html        # Profanity validator UI
└── ml_model/                 # Python Machine Learning Service
    ├── app.py                # Flask API
    ├── train_model.py        # Model training script
    └── requirements.txt      # Python dependencies
```

---

## Getting Started

### 1. Prerequisite Configuration

Create a `.env` file in the `backend/` directory with the following variables:

```env
PORT=8080
MONGO_URL=mongodb://localhost:27017/news-credibility
JWT_SECRET=your_jwt_secret_key
NEWS_API_KEY=25d41753f3594565ba2ce59280fab14d
```

### 2. Launching the Backend Server

The Express server serves the static frontend pages on `/` and hosts the REST API endpoints.

```bash
cd backend
npm install
npm start
```

Once started, open your browser and navigate to:
👉 **[http://localhost:8080](http://localhost:8080)**

### 3. Launching the ML Service

The Flask API runs the news credibility predictions.

```bash
cd ml_model
pip install -r requirements.txt
python train_model.py       # Trains the model (optional, saves model.pkl)
python app.py               # Starts Flask server on port 5000
```