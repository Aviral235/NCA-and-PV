// backend/index.js
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const passport = require("passport");
const cors = require("cors");
const path = require("path");

const app = express();
const port = process.env.PORT || 8080;

// Enable CORS for frontend requests
app.use(cors());
app.use(express.json());

// Serve static frontend files from frontend/dist
app.use(express.static(path.join(__dirname, "../frontend/dist")));

// Connect to MongoDB
const mongoUrl = process.env.MONGO_URL;
if (!mongoUrl) {
    console.warn("⚠️ WARNING: MONGO_URL environment variable is not defined in .env file.");
} else {
    mongoose.connect(mongoUrl, {})
    .then(() => {
        console.log("✅ Connected to MongoDB successfully!");
    })
    .catch((err) => {
        console.error("❌ Error while connecting to MongoDB:\n", err);
    });
}

// Passport Configuration for JWT
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const User = require("./models/User");

const opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = process.env.JWT_SECRET || "supposedtobe";

passport.use(new JwtStrategy(opts, async function(jwt_payload, done) {
    try {
        const user = await User.findOne({ _id: jwt_payload.id });
        if (user) {
            return done(null, user);
        } else {
            return done(null, false);
        }
    } catch (err) {
        return done(err, false);
    }
}));

// Route Definitions
const authRoutes = require("./routes/auth");
const newsRoutes = require("./routes/news");
const profanityRoutes = require("./routes/profanity");
const analyzeRoutes = require("./routes/analyze");
const historyRoutes = require("./routes/history");

app.use("/", authRoutes);
app.use("/api/news", newsRoutes);
app.use("/api/validate-profanity", profanityRoutes);
app.use("/api/analyze", analyzeRoutes);
app.use("/api/analysis", analyzeRoutes);
app.use("/api/analyses", historyRoutes);

// Test Route
app.get("/home", (req, res) => {
    res.send("Hello, World!");
});

// Fallback to index.html for single page application feel
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
});

// Start Server
app.listen(port, () => {
    console.log("🚀 Server is running on port: " + port);
});
