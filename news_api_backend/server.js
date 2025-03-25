const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors()); // Enable CORS for frontend requests

const API_KEY = "25d41753f3594565ba2ce59280fab14d"; // Replace with your NewsAPI key
const NEWS_API_URL = `https://newsapi.org/v2/top-headlines?country=us&apiKey=${API_KEY}`;

app.get("/news", async (req, res) => {
    try {
        const response = await axios.get(NEWS_API_URL);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch news" });
    }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
