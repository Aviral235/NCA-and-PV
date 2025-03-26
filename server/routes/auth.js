const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcrypt");
const { getToken } = require("../utils/helpers") 

router.post("/signup.html",async (req,res) => {

    const {  fullName, email, password } = req.body;
    
    if (!email || !password || !fullName) {
        return res.status(400).json({ error: "All fields are required" });
    }

    const user = await User.findOne({ email : email });
    if(user) {
        return res
        .status(403)
        .json({ err : "A user with this email already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUserData = { 
        fullName,
        email,
        password : hashedPassword,
    };
    const newUser = await User.create(newUserData);

    const token = await getToken(email, newUser);

    const userToReturn = {...newUser.toJSON(), token };
    delete userToReturn.password;
    return res.status(200).json(userToReturn);

});

router.post("/login.html", async (req,res) => {
    const { email, password } =req.body;

    const user = await User.findOne({ email : email });
    if(!user){
        return res.status(401).json({ err : "Invalid credentials" });
    }

    const isPasswordValid = await bcrypt.compare( password,user.password );
    if(!isPasswordValid){
        return res.status(401).json({ err : "Invalid credentials" });
    }

try {
    const token1 = await getToken(user.email, user);
    const userToReturn = { ...user.toJSON(), token: token1 };
    delete userToReturn.password;
    return res.status(200).json(userToReturn);
} catch (error) {
    console.error("Error during login:", error);
    return res.status(500).json({ error: "Internal server error" });
}});
module.exports = router;