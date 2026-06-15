// backend/utils/middleware.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "supposedtobe";

async function authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    let token = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
    } else if (req.headers["x-access-token"]) {
        token = req.headers["x-access-token"];
    }

    if (!token) {
        return res.status(401).json({ error: "No token provided" });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (!decoded || !decoded.id) {
            return res.status(401).json({ error: "Invalid token payload" });
        }

        const user = await User.findOne({ _id: decoded.id });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        req.user = user; // attach for downstream handlers
        next();
    } catch (err) {
        console.error("JWT verification error in middleware:", err.message);
        return res.status(401).json({ error: "Invalid or expired token" });
    }
}

module.exports = {
    authenticateToken
};
