// backend/routes/analyze.js
const express = require("express");
const router = express.Router();
const axios = require("axios");
const cheerio = require("cheerio");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Analysis = require("../models/Analysis");
const profanityList = require("../utils/profanityList");

const JWT_SECRET = process.env.JWT_SECRET || "supposedtobe";

// Helper for optional authentication
async function optionalAuthenticate(req, res, next) {
    const authHeader = req.headers["authorization"];
    let token = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
    } else if (req.headers["x-access-token"]) {
        token = req.headers["x-access-token"];
    }

    if (!token) {
        req.user = null;
        return next();
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded && decoded.id) {
            const user = await User.findOne({ _id: decoded.id });
            if (user) {
                req.user = user;
            }
        }
        next();
    } catch (err) {
        return res.status(401).json({ error: "Invalid or expired token" });
    }
}

// Leetspeak clean mapping
const leetMap = {
    '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't',
    '$': 's', '@': 'a', '!': 'i', '*': ''
};

function cleanText(text) {
    if (!text) return "";
    let cleaned = text.toLowerCase();
    cleaned = cleaned.split('').map(char => leetMap[char] || char).join('');
    cleaned = cleaned.replace(/[.,\/#!%\^&\*;:{}=\-_`~()?"'’]/g, "");
    return cleaned;
}

// Global helper to query either collection by ID
async function findAnalysisById(id) {
    try {
        // 1. Search in global Analysis collection
        let report = await Analysis.findById(id);
        if (report) return report;
        
        // 2. Fallback to User subdocuments
        const user = await User.findOne({ "analyses._id": id });
        if (user) {
            return user.analyses.id(id);
        }
        return null;
    } catch (err) {
        console.error("Error finding analysis by ID:", err.message);
        return null;
    }
}

// Common core analysis pipeline
async function executeAnalysisPipeline(inputType, url, text) {
    let textContent = "";
    let inputSource = "";
    let headline = "";
    let sourceReputation = "UNVERIFIED";

    if (inputType === "url") {
        if (!url) {
            throw new Error("URL is required for URL analysis.");
        }
        inputSource = url;
        
        try {
            // Fetch web page HTML
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
                },
                timeout: 10000
            });
            const $ = cheerio.load(response.data);
            
            // Extract headline
            headline = $("h1").first().text().trim() || $("title").first().text().trim() || "Scraped News Article";
            
            // Extract domain and calculate source reputation
            try {
                const urlObj = new URL(url);
                const domain = urlObj.hostname.replace('www.', '').toLowerCase();
                
                const reliableDomains = ["apnews.com", "reuters.com", "bbc.com", "bbc.co.uk", "nytimes.com", "wsj.com", "bloomberg.com", "theguardian.com", "npr.org", "nature.com", "nasa.gov"];
                const unreliableDomains = ["infowars.com", "theonion.com", "breitbart.com", "dailymail.co.uk"];
                
                if (reliableDomains.some(d => domain.includes(d))) {
                    sourceReputation = "RELIABLE";
                } else if (unreliableDomains.some(d => domain.includes(d))) {
                    sourceReputation = "UNRELIABLE";
                } else {
                    sourceReputation = "UNVERIFIED";
                }
            } catch (err) {
                console.warn("Error parsing domain for reputation:", err.message);
            }

            // Strip structural & non-content elements
            $("script, style, iframe, header, footer, nav, noscript, head, link, meta").remove();
            
            let articleText = [];
            $("p, h1, h2, h3").each((i, el) => {
                const chunk = $(el).text().trim();
                if (chunk.length > 20) {
                    articleText.push(chunk);
                }
            });

            textContent = articleText.join("\n");
            if (!textContent) {
                throw new Error("Could not extract readable article text from this URL.");
            }
        } catch (err) {
            console.warn("Web scraping error inside pipeline, using fallback:", err.message);
            try {
                const urlObj = new URL(url);
                headline = urlObj.hostname.replace("www.", "") + " News Story";
                textContent = `This news story is published on ${urlObj.hostname}. Clean text extraction is blocked by security or publication format. Tapping Quick Scan will run credibility diagnostics on the live website URL directly.`;
                sourceReputation = "UNVERIFIED";
            } catch (e) {
                throw new Error("Failed to parse URL in scraper fallback.");
            }
        }
    } else {
        if (!text || text.trim().length === 0) {
            throw new Error("Raw text is required for text analysis.");
        }
        textContent = text.trim();
        inputSource = textContent.substring(0, 80) + (textContent.length > 80 ? "..." : "");
        
        // Use first sentence or line as headline
        const lines = textContent.split(/\r?\n/);
        headline = lines[0].substring(0, 100) + (lines[0].length > 100 ? "..." : "");
        sourceReputation = "UNVERIFIED";
    }

    // 1. Get credibility and deep-dive NLP metrics from Flask ML service
    let credibility = { 
        prediction: "UNKNOWN", 
        confidence: 0.5,
        bias: "CENTER",
        clickbait_score: 10.0,
        tldr: ["Extractive summary is unavailable.", "Full credibility checks are pending.", "Original article content may be too short."]
    };
    
    try {
        const flaskResponse = await axios.post("http://127.0.0.1:5000/predict", { 
            text: textContent,
            headline: headline
        }, { timeout: 8000 });
        
        credibility = {
            prediction: flaskResponse.data.prediction,
            confidence: flaskResponse.data.confidence,
            bias: flaskResponse.data.bias || "CENTER",
            clickbait_score: flaskResponse.data.clickbait_score || 10.0,
            tldr: flaskResponse.data.tldr || credibility.tldr
        };
    } catch (mlErr) {
        console.error("Flask ML prediction error:", mlErr.message);
    }

    // 2. Process custom profanity validation
    const cleanedText = cleanText(textContent);
    const tokens = cleanedText.split(/\s+/);
    const flaggedWords = [];

    profanityList.forEach(badWord => {
        tokens.forEach(token => {
            if (token === badWord) {
                if (!flaggedWords.includes(badWord)) {
                    flaggedWords.push(badWord);
                }
            }
        });
        if (badWord.length > 3 && cleanedText.includes(badWord)) {
            if (!flaggedWords.includes(badWord)) {
                flaggedWords.push(badWord);
            }
        }
    });

    const containsProfanity = flaggedWords.length > 0;
    const credibilityScore = Math.round((credibility.prediction === "REAL" ? credibility.confidence : (1 - credibility.confidence)) * 100);

    return {
        inputType,
        inputSource,
        textContent,
        headline,
        credibilityScore,
        containsProfanity,
        profanityCount: flaggedWords.length,
        flaggedWords,
        prediction: credibility.prediction,
        confidence: credibility.confidence,
        tldr: credibility.tldr,
        clickbaitScore: credibility.clickbait_score,
        bias: credibility.bias,
        sourceReputation
    };
}

// 1. POST /api/analyze - Run full analysis
router.post("/", optionalAuthenticate, async (req, res) => {
    const { url, text, inputType } = req.body;

    if (!inputType || !["url", "text"].includes(inputType)) {
        return res.status(400).json({ error: "Invalid or missing inputType ('url' or 'text' required)." });
    }

    try {
        const result = await executeAnalysisPipeline(inputType, url, text);

        // Save to global Analysis collection
        const globalAnalysis = new Analysis({
            inputType: result.inputType,
            inputSource: result.inputSource,
            textContent: result.textContent,
            credibilityScore: result.credibilityScore,
            prediction: result.prediction,
            containsProfanity: result.containsProfanity,
            profanityCount: result.profanityCount,
            flaggedWords: result.flaggedWords,
            headline: result.headline,
            tldr: result.tldr,
            clickbaitScore: result.clickbaitScore,
            bias: result.bias,
            sourceReputation: result.sourceReputation
        });
        await globalAnalysis.save();

        let savedId = globalAnalysis._id;

        // If authenticated, also append to user document (under same ID)
        if (req.user) {
            req.user.analyses.push({
                _id: globalAnalysis._id,
                inputType: result.inputType,
                inputSource: result.inputSource,
                textContent: result.textContent,
                credibilityScore: result.credibilityScore,
                prediction: result.prediction,
                containsProfanity: result.containsProfanity,
                profanityCount: result.profanityCount,
                flaggedWords: result.flaggedWords,
                headline: result.headline,
                tldr: result.tldr,
                clickbaitScore: result.clickbaitScore,
                bias: result.bias,
                sourceReputation: result.sourceReputation
            });
            await req.user.save();
        }

        return res.status(200).json({
            success: true,
            inputType: result.inputType,
            inputSource: result.inputSource,
            textContent: result.textContent,
            headline: result.headline,
            credibility: {
                prediction: result.prediction,
                confidence: result.confidence,
                score: result.credibilityScore
            },
            profanity: {
                contains_profanity: result.containsProfanity,
                profanity_count: result.profanityCount,
                flagged_words: result.flaggedWords
            },
            nlp: {
                bias: result.bias,
                clickbait_score: result.clickbaitScore,
                tldr: result.tldr,
                source_reputation: result.sourceReputation
            },
            savedId: savedId
        });

    } catch (error) {
        console.error("Analysis pipeline error:", error.message);
        return res.status(500).json({ error: error.message || "Failed during analysis." });
    }
});

// 2. POST /api/analyze/initialize - Find or create analysis by URL
router.post("/initialize", optionalAuthenticate, async (req, res) => {
    const { url } = req.body;
    if (!url) {
        return res.status(400).json({ error: "URL is required to initialize an article." });
    }

    try {
        // Search if URL already analyzed in global collection
        let existing = await Analysis.findOne({ inputSource: url });
        if (existing) {
            // If logged in and not in user history, push it
            if (req.user && !req.user.analyses.id(existing._id)) {
                req.user.analyses.push({
                    _id: existing._id,
                    inputType: existing.inputType,
                    inputSource: existing.inputSource,
                    textContent: existing.textContent,
                    credibilityScore: existing.credibilityScore,
                    prediction: existing.prediction,
                    containsProfanity: existing.containsProfanity,
                    profanityCount: existing.profanityCount,
                    flaggedWords: existing.flaggedWords,
                    headline: existing.headline,
                    tldr: existing.tldr,
                    clickbaitScore: existing.clickbaitScore,
                    bias: existing.bias,
                    sourceReputation: existing.sourceReputation
                });
                await req.user.save();
            }
            return res.status(200).json({ success: true, id: existing._id });
        }

        // Check fallback user collections
        const matchingUser = await User.findOne({ "analyses.inputSource": url });
        if (matchingUser) {
            const subdoc = matchingUser.analyses.find(a => a.inputSource === url);
            if (subdoc) {
                // Seed globally for sharing compatibility
                const globalAnalysis = new Analysis({
                    _id: subdoc._id,
                    inputType: subdoc.inputType,
                    inputSource: subdoc.inputSource,
                    textContent: subdoc.textContent,
                    credibilityScore: subdoc.credibilityScore,
                    prediction: subdoc.prediction,
                    containsProfanity: subdoc.containsProfanity,
                    profanityCount: subdoc.profanityCount,
                    flaggedWords: subdoc.flaggedWords,
                    headline: subdoc.headline,
                    tldr: subdoc.tldr,
                    clickbaitScore: subdoc.clickbaitScore,
                    bias: subdoc.bias,
                    sourceReputation: subdoc.sourceReputation
                });
                await globalAnalysis.save();

                if (req.user && !req.user.analyses.id(subdoc._id)) {
                    req.user.analyses.push(subdoc);
                    await req.user.save();
                }
                return res.status(200).json({ success: true, id: subdoc._id });
            }
        }

        // Trigger analysis pipeline
        const result = await executeAnalysisPipeline("url", url, "");

        const newAnalysis = new Analysis({
            inputType: result.inputType,
            inputSource: result.inputSource,
            textContent: result.textContent,
            credibilityScore: result.credibilityScore,
            prediction: result.prediction,
            containsProfanity: result.containsProfanity,
            profanityCount: result.profanityCount,
            flaggedWords: result.flaggedWords,
            headline: result.headline,
            tldr: result.tldr,
            clickbaitScore: result.clickbaitScore,
            bias: result.bias,
            sourceReputation: result.sourceReputation
        });
        await newAnalysis.save();

        if (req.user) {
            req.user.analyses.push({
                _id: newAnalysis._id,
                inputType: result.inputType,
                inputSource: result.inputSource,
                textContent: result.textContent,
                credibilityScore: result.credibilityScore,
                prediction: result.prediction,
                containsProfanity: result.containsProfanity,
                profanityCount: result.profanityCount,
                flaggedWords: result.flaggedWords,
                headline: result.headline,
                tldr: result.tldr,
                clickbaitScore: result.clickbaitScore,
                bias: result.bias,
                sourceReputation: result.sourceReputation
            });
            await req.user.save();
        }

        return res.status(200).json({ success: true, id: newAnalysis._id });

    } catch (err) {
        console.error("Initialization error:", err.message);
        return res.status(500).json({ error: err.message || "Failed to initialize and analyze URL." });
    }
});

// 3. GET /api/analyze/public/:id - Get public report
router.get("/public/:id", async (req, res) => {
    try {
        const report = await findAnalysisById(req.params.id);
        if (!report) {
            return res.status(404).json({ error: "Analysis report not found." });
        }
        return res.status(200).json({ success: true, report });
    } catch (err) {
        console.error("Public report fetch error:", err);
        return res.status(500).json({ error: "Failed to retrieve public analysis report." });
    }
});

// 4. GET /api/analyze/:id - Get detailed report (private detailed view)
router.get("/:id", optionalAuthenticate, async (req, res) => {
    try {
        const report = await findAnalysisById(req.params.id);
        if (!report) {
            return res.status(404).json({ error: "Analysis details not found." });
        }
        return res.status(200).json({ success: true, report });
    } catch (err) {
        console.error("Detailed report fetch error:", err);
        return res.status(500).json({ error: "Failed to retrieve analysis details." });
    }
});

module.exports = router;
