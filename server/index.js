const express = require("express");


const app = express();
const port = process.env.PORT || 8080;


const mongoose = require("mongoose");
const passport = require("passport");
const User = require("./models/User");
const authRoutes = require("./routes/auth");
const core = require("cors");


const JwtStrategy = require('passport-jwt').Strategy,
    ExtractJwt = require('passport-jwt').ExtractJwt;

app.use(core());
app.use(express.json());
require("dotenv").config();

mongoose.connect(
    
    "mongodb+srv://User2:" +
    // process.env.MONGO_PASSWORD +
    "Hello1234" +
    "@cluster0.dupns.mongodb.net/NCnPV?retryWrites=true&w=majority&appName=Cluster0",
    {}
)
.then((x) => {
    console.log("connected to mongo!");
})
.catch((err) => {
    console.log("Error while connecting to mongo\n",err);
});



let opts = {}
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = "supposedtobe";

passport.use(new JwtStrategy(opts, async function(jwt_payload, done) {
try {
    const user = await User.findOne({ _id: jwt_payload.id });
    if (user) {
        return done(null, user);
    } else {
        return done(null, false);
    }
} catch (err) {
    return done(err, false);
}
}));



app.use("/", authRoutes);


app.get("/home",(req,res) => {
    res.send("Hello , World!");

});

app.listen(port , () => {
    console.log("App is running on port : " + port);
});