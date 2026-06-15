// backend/routes/history.js
const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../utils/middleware");

// Fetch logged-in user's past analyses from their embedded array
router.get("/history", authenticateToken, async (req, res) => {
    try {
        const analyses = [...req.user.analyses]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 50); // Get up to 50 recent records
        return res.status(200).json({ success: true, analyses });
    } catch (error) {
        console.error("Fetch history error:", error);
        return res.status(500).json({ error: "Failed to retrieve analysis history." });
    }
});

// Delete specific analysis from the user's embedded array
router.delete("/history/:id", authenticateToken, async (req, res) => {
    try {
        const initialLength = req.user.analyses.length;
        req.user.analyses.pull({ _id: req.params.id });
        
        if (req.user.analyses.length === initialLength) {
            return res.status(404).json({ error: "Analysis not found or unauthorized." });
        }
        
        await req.user.save();
        return res.status(200).json({ success: true, message: "Analysis history item deleted." });
    } catch (error) {
        console.error("Delete history error:", error);
        return res.status(500).json({ error: "Failed to delete history item." });
    }
});

module.exports = router;
