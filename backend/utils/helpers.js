// backend/utils/helpers.js
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "supposedtobe";

exports = {};

exports.getToken = async (email, user) => {
    const token = jwt.sign(
        { id: user._id, email: user.email },
        JWT_SECRET,
        { expiresIn: "30d" } // 30 days expiry
    );
    return token;
};

module.exports = exports;