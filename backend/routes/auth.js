// backend/routes/auth.js
const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { getToken } = require("../utils/helpers");
const { authenticateToken } = require("../utils/middleware");


const JWT_SECRET = process.env.JWT_SECRET || "supposedtobe";

// Helper to sanitize user object (remove password)
const sanitizeUser = (user) => {
    const userObj = user.toJSON ? user.toJSON() : { ...user };
    delete userObj.password;
    return userObj;
};

// Signup Route (with compatibility alias)
const signupHandler = async (req, res) => {
    const { fullName, email, password } = req.body;
    
    if (!email || !password || !fullName) {
        return res.status(400).json({ error: "All fields are required" });
    }

    try {
        const user = await User.findOne({ email : email });
        if(user) {
            return res.status(403).json({ error : "A user with this email already exists." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUserData = { 
            fullName,
            email,
            password : hashedPassword,
        };
        const newUser = await User.create(newUserData);
        const token = await getToken(email, newUser);

        const userToReturn = { ...sanitizeUser(newUser), token };
        return res.status(200).json(userToReturn);
    } catch (error) {
        console.error("Error during signup:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

router.post("/signup", signupHandler);
router.post("/signup.html", signupHandler);

// Login Route (with compatibility alias)
const loginHandler = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
    }

    try {
        const user = await User.findOne({ email : email });
        if(!user){
            return res.status(401).json({ error : "Invalid credentials" });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if(!isPasswordValid){
            return res.status(401).json({ error : "Invalid credentials" });
        }

        const token = await getToken(user.email, user);
        const userToReturn = { ...sanitizeUser(user), token };
        return res.status(200).json(userToReturn);
    } catch (error) {
        console.error("Error during login:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

router.post("/login", loginHandler);
router.post("/login.html", loginHandler);


// Profile Routes
router.get("/api/me", authenticateToken, async (req, res) => {
    return res.status(200).json(sanitizeUser(req.user));
});

router.get("/api/auth/me", authenticateToken, async (req, res) => {
    return res.status(200).json(sanitizeUser(req.user));
});

// Update Profile Route
router.post("/api/auth/update", authenticateToken, async (req, res) => {
    const { fullName, email, currentPassword, newPassword, role, organization, bio, twitter, linkedin, avatar } = req.body;
    const user = req.user;

    try {
        if (fullName) {
            user.fullName = fullName;
        }

        if (email && email !== user.email) {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(403).json({ error: "Email is already in use by another account." });
            }
            user.email = email;
        }

        if (role !== undefined) {
            user.role = role;
        }

        if (organization !== undefined) {
            user.organization = organization;
        }

        if (bio !== undefined) {
            user.bio = bio;
        }

        if (twitter !== undefined) {
            user.twitter = twitter;
        }

        if (linkedin !== undefined) {
            user.linkedin = linkedin;
        }

        if (avatar !== undefined) {
            user.avatar = avatar;
        }

        let passwordChanged = false;
        if (newPassword) {
            if (!currentPassword) {
                return res.status(400).json({ error: "Current password is required to change password." });
            }
            const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
            if (!isPasswordValid) {
                return res.status(401).json({ error: "Invalid current password." });
            }
            if (newPassword.length < 6) {
                return res.status(400).json({ error: "New password must be at least 6 characters." });
            }
            user.password = await bcrypt.hash(newPassword, 10);
            passwordChanged = true;
        }

        await user.save();
        const token = await getToken(user.email, user);
        
        return res.status(200).json({
            ...sanitizeUser(user),
            token,
            passwordChanged
        });
    } catch (error) {
        console.error("Error during profile update:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});

// Delete Account Route
router.delete("/api/auth/delete", authenticateToken, async (req, res) => {
    try {
        await User.deleteOne({ _id: req.user._id });
        return res.status(200).json({ success: true, message: "Account deleted successfully." });
    } catch (error) {
        console.error("Error during account deletion:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});

module.exports = router;