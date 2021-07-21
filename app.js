require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const passport = require("passport");
const session = require("express-session");
const LocalStrategy = require("passport-local").Strategy;
const flash = require('connect-flash');

const app = express();


app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

mongoose.connect(process.env.MONGODB, { useNewUrlParser: true, useUnifiedTopology: true });

const userSchema = new mongoose.Schema({
    fullName: String,
    phone: Number,
    email: String,
    password: String
});

const User = mongoose.model("User", userSchema);

passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
        done(err, user);
    });
});

passport.use(new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: true,
    },
    function(req, email, password, done) {
        User.findOne({ email: email }, function(err, user) {
            if (err) { return done(err); }
            if (!user) { return done(null, false, req.flash("error", "Invalid Email!!")); }
            bcrypt.compare(password, user.password, function(err, isMatch) {
                if (err) {
                    console.log(err);
                }
                if (isMatch) {
                    return done(null, user);
                } else {
                    return done(null, false, req.flash("error", "Incorrect Password!!"));
                }
            });
        });
    }
));

app.get("/", (req, res) => {
    let errors = req.flash("error") || [];
    res.render("index", { errors });
});

app.get("/logout", (req, res) => {
    req.logOut();
    res.redirect("/login");
});

app.get("/login", (req, res) => {
    let errors = req.flash("error") || [];
    res.render("login", { errors });
});

app.get("/secrets", (req, res) => {
    if (req.isAuthenticated()) {
        res.render("secrets");
    } else {
        res.redirect("/login");
    }
});

app.post("/", (req, res) => {
    User.findOne({ email: req.body.email }, function(err, foundUser) {
        if (err) {
            console.log(err);
        } else {
            if (foundUser) {
                req.flash("error", "Email address already exists!!!");
                res.redirect("/");
            } else if (req.body.password != req.body.password2) {
                req.flash("error", "Password does not Match!!!");
                res.redirect("/");
            } else {
                const saltRounds = 10;
                bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
                    const newUser = new User({
                        fullName: req.body.fullName,
                        phone: req.body.phone,
                        email: req.body.email,
                        password: hash
                    });
                    newUser.save((err, user) => {
                        if (err) {
                            console.log(err);
                        } else {
                            console.log("You are successfully registered.");
                            console.log(user);
                            passport.authenticate("local")(req, res, function() {
                                res.redirect("/secrets");
                            });
                        }
                    });
                });
            }
        }
    });

});

app.post('/login',
    passport.authenticate('local', { successRedirect: '/secrets', failureFlash: true, failureRedirect: '/login' }));

app.listen(3000, () => {
    console.log("Server started at port 3000");
});