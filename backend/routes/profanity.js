// backend/routes/profanity.js
const express = require("express");
const router = express.Router();
const profanityList = require("../utils/profanityList");

// Leetspeak mapping
const leetMap = {
    '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't',
    '$': 's', '@': 'a', '!': 'i', '*': ''
};

function cleanText(text) {
    if (!text) return "";
    let cleaned = text.toLowerCase();
    
    // Replace leetspeak and remove common mask characters
    cleaned = cleaned.split('').map(char => leetMap[char] || char).join('');
    
    // Strip other common punctuation but keep spaces
    cleaned = cleaned.replace(/[.,\/#!%\^&\*;:{}=\-_`~()?"'’]/g, "");
    return cleaned;
}

router.post("/", (req, res) => {
    const { text } = req.body;
    
    if (!text || typeof text !== "string") {
        return res.status(400).json({ success: false, message: "No text provided or invalid format." });
    }
    
    const cleanedText = cleanText(text);
    const tokens = cleanedText.split(/\s+/);
    
    const flaggedWords = [];
    
    profanityList.forEach(badWord => {
        // Check 1: Direct token match (exact word)
        tokens.forEach(token => {
            if (token === badWord) {
                if (!flaggedWords.includes(badWord)) {
                    flaggedWords.push(badWord);
                }
            }
        });
        
        // Check 2: Substring match for compound words (e.g. "shithead"), 
        // but avoid false positives on short words (like "ass" in "class", "crap" in "scrap" - but "crap" is long enough, "ass" is short)
        if (badWord.length > 3 && cleanedText.includes(badWord)) {
            if (!flaggedWords.includes(badWord)) {
                flaggedWords.push(badWord);
            }
        }
    });
    
    const containsProfanity = flaggedWords.length > 0;
    
    return res.status(200).json({
        success: true,
        contains_profanity: containsProfanity,
        profanity_count: flaggedWords.length,
        flagged_words: flaggedWords
    });
});

module.exports = router;
