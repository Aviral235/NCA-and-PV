const mongoose = require("mongoose");

const User = new mongoose.Schema({
    fullName: {
        type : String,
        required: true,
    },
    email : {
        type: String,
        required : true,
        unique : true,
    },
    password : {
        type : String,
        required : true,
        private : true,
    },
});

const UserModel = mongoose.model("User",User);

module.exports = UserModel;