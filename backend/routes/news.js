// backend/routes/news.js
const express = require("express");
const router = express.Router();
const axios = require("axios");
const cheerio = require("cheerio");

const NEWSDATA_API_KEY = process.env.NEWSDATA_API_KEY || "";
const GNEWS_API_KEY = process.env.GNEWS_API_KEY || "";

function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function mapCategoryForGNews(category) {
    const cat = category.toLowerCase();
    if (cat === "politics") return "nation";
    if (cat === "technology") return "technology";
    if (cat === "science") return "science";
    if (cat === "business") return "business";
    if (cat === "world") return "world";
    return null;
}

router.get("/", async (req, res) => {
    const page = req.query.page || "1";
    const limit = parseInt(req.query.limit) || 10;
    const category = req.query.category || "all";
    
    let articles = [];
    let nextPage = null;

    // 1. Try GNews first if key is configured
    if (GNEWS_API_KEY && GNEWS_API_KEY !== "placeholder" && GNEWS_API_KEY !== "") {
        try {
            let pageNum = parseInt(page);
            if (isNaN(pageNum)) pageNum = 1;
            
            let url = `https://gnews.io/api/v4/top-headlines?lang=en&country=us&token=${GNEWS_API_KEY}&max=${limit}&page=${pageNum}`;
            const mappedCat = mapCategoryForGNews(category);
            if (mappedCat) {
                url += `&category=${mappedCat}`;
            }
            
            const response = await axios.get(url, { timeout: 6000 });
            if (response.data && response.data.articles && response.data.articles.length > 0) {
                articles = response.data.articles.map(item => ({
                    title: item.title || "No Title",
                    url: item.url || "",
                    description: item.description || "Click Quick Analyze to evaluate the full credibility of this story.",
                    imageUrl: item.image || "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&q=80",
                    sourceName: item.source ? item.source.name : "GNews",
                    category: category !== "all" ? category : "world",
                    publishedAt: item.publishedAt || new Date().toISOString()
                }));
                const hasMore = articles.length === limit;
                nextPage = hasMore ? (pageNum + 1) : null;
            }
        } catch (error) {
            console.warn("GNews fetch failed:", error.message);
        }
    }

    // 2. Try Newsdata.io as fallback if GNews has no articles
    if (articles.length === 0 && NEWSDATA_API_KEY && NEWSDATA_API_KEY !== "placeholder" && NEWSDATA_API_KEY !== "") {
        try {
            const size = Math.min(limit, 10);
            let url = `https://newsdata.io/api/1/news?apikey=${NEWSDATA_API_KEY}&country=us&language=en&size=${size}`;
            
            if (category !== "all") {
                url += `&category=${category.toLowerCase()}`;
            } else {
                url += `&category=business,technology,science,world,politics`;
            }

            if (page && page !== "1" && page !== "") {
                url += `&page=${page}`;
            }

            const response = await axios.get(url, { timeout: 6000 });
            if (response.data && response.data.results && response.data.results.length > 0) {
                articles = response.data.results.map(item => ({
                    title: item.title || "No Title",
                    url: item.link || "",
                    description: item.description || item.content || "Click Quick Analyze to evaluate the full credibility of this story.",
                    imageUrl: item.image_url || "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&q=80",
                    sourceName: item.source_id || "Newsdata",
                    category: category !== "all" ? category : (item.category ? item.category[0] : "world"),
                    publishedAt: item.pubDate || new Date().toISOString()
                }));
                nextPage = response.data.nextPage || null;
            }
        } catch (error) {
            console.warn("Newsdata.io fetch failed:", error.message);
        }
    }

    // De-duplicate live articles by title
    const seenTitles = new Set();
    articles = articles.filter(a => {
        const cleanTitle = a.title.toLowerCase().trim();
        if (seenTitles.has(cleanTitle)) return false;
        seenTitles.add(cleanTitle);
        return true;
    });

    if (category === "all" && articles.length > 0) {
        articles = shuffleArray(articles);
    }

    return res.json({ 
        success: true, 
        articles, 
        nextPage,
        usingFallback: false
    });
});

// Full-text scraping proxy endpoint using cheerio for payload extraction
router.get("/extract", async (req, res) => {
    const { url } = req.query;
    if (!url) {
        return res.status(400).json({ error: "URL query parameter is required." });
    }
    
    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
            },
            timeout: 8000
        });
        const html = response.data;
        const $ = cheerio.load(html);
        
        // Remove structural elements for body text extraction
        const clean$ = cheerio.load(html);
        clean$("script, style, iframe, head, link, meta, header, footer, nav, noscript").remove();
        
        let paragraphs = [];
        clean$("p").each((i, el) => {
            const text = clean$(el).text().trim();
            if (text.length > 20) {
                paragraphs.push(text);
            }
        });
        
        const textContent = paragraphs.join("\n\n");
        const title = $("h1").first().text().trim() || $("title").first().text().trim() || "Scraped News Article";
        
        // Metadata extraction
        const author = $('meta[name="author"]').attr('content') || 
                       $('meta[property="og:site_name"]').attr('content') || 
                       $('meta[name="twitter:creator"]').attr('content') || 
                       "Unknown Author";
                       
        const publishedAt = $('meta[property="article:published_time"]').attr('content') || 
                            $('meta[name="pubdate"]').attr('content') || 
                            $('meta[property="og:published_time"]').attr('content') || 
                            new Date().toISOString();
                            
        const imageUrl = $('meta[property="og:image"]').attr('content') || 
                         $('meta[name="twitter:image"]').attr('content') || 
                         "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&q=80";

        return res.json({
            success: true,
            title,
            textContent,
            author,
            publishedAt,
            imageUrl
        });
    } catch (err) {
        console.warn("Extraction failed, returning fallback metadata:", err.message);
        try {
            const urlObj = new URL(url);
            return res.json({
                success: true,
                title: "Scraped Article",
                textContent: "Clean text extraction is blocked by security or publication format. Tapping Quick Scan will run credibility diagnostics on the live website URL directly.",
                author: urlObj.hostname.replace("www.", ""),
                publishedAt: new Date().toISOString(),
                imageUrl: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&q=80"
            });
        } catch (e) {
            return res.status(500).json({ error: "Failed to scrape the URL." });
        }
    }
});

module.exports = router;
