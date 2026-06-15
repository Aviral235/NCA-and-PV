// backend/models/Analysis.js
const mongoose = require("mongoose");

const AnalysisSchema = new mongoose.Schema({
    inputType: {
        type: String, // "url" or "text"
        required: true
    },
    inputSource: {
        type: String, // The URL or a snippet of the text
        required: true
    },
    textContent: {
        type: String,
        required: true
    },
    credibilityScore: {
        type: Number, // 0 to 100
        required: true
    },
    prediction: {
        type: String, // "REAL" or "FAKE"
        required: true
    },
    containsProfanity: {
        type: Boolean,
        required: true
    },
    profanityCount: {
        type: Number,
        required: true
    },
    flaggedWords: [String],
    headline: {
        type: String,
        default: ""
    },
    tldr: [String],
    clickbaitScore: {
        type: Number,
        default: 0
    },
    bias: {
        type: String,
        default: "CENTER"
    },
    sourceReputation: {
        type: String,
        default: "UNVERIFIED"
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const AnalysisModel = mongoose.model("Analysis", AnalysisSchema);

module.exports = AnalysisModel;
