const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const multer = require('multer');
const fs = require('fs');

//multer initialization
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/images');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

//multer upload avatar function
const uploadAvatar = multer({storage: storage});

//TODO: multer upload article function

//User Model
const User = require("../models/User");
const { findByIdAndUpdate, find } = require("../models/User");

//Article Model
const Article = require('../models/Article')

router.get('/', async (req, res) => {

    const USER = req.session.user;
    let errors = [];
    let ARTICLE;
    try {
        ARTICLE = await Article.find({author: USER._id});
        res.render('pages/dashboard', {USER, errors, ARTICLE});
    } catch (err) {
        errors.push({color: "alert-danger", msg: "Something went wrong when loading user's articles"});
        ARTICLE = [];
        res.render('pages/dashboard', {USER, errors, ARTICLE});
    }
    
});

router.get('/editInfo', (req, res) => {
    res.redirect('/users/dashboard');
});

// Change user's information handler
router.post('/editInfo', async (req, res) => {
    
    //! pull variables out of req.body
    const { firstName, lastName, email, mobileNumber } = req.body;
    
    let USER = req.session.user;

    let errors = [];

    let updated = {};

    try{
        
        if (firstName !== USER.firstName && firstName !== "") {
            updated.firstName = firstName;
        }

        if (lastName !== USER.lastName && lastName !== "") {
            updated.lastName = lastName;
        }

        if (email !== USER.email && email !== "") {
            //In ES6 you can write findOne({email}) instead of fondOne({email: email});
            let userExist = await User.findOne({email});
            
            if (userExist) errors.push({color: "alert-warning", msg: "The Email already exist"});
            else updated.email = email;
        }

        if (mobileNumber !== USER.mobileNumber && mobileNumber !== "") {
            //In ES6 you can write findOne({email}) instead of fondOne({email: email});
            let userExist = await User.findOne({mobileNumber});
            
            if (userExist) errors.push({color: "alert-warning", msg: "The mobile number already exist"});
            else updated.mobileNumber = mobileNumber;
        }

        if(errors.length === 0) {
            const NEW_USER = await User.findByIdAndUpdate(USER._id, updated, {new: true});
            req.session.user = NEW_USER;
            USER = req.session.user;
            errors.push({color: "alert-success", msg: "Your information updated successfully"});
            res.render("pages/dashboard", {errors, USER});
        } else {
            res.render("pages/dashboard", {errors, USER});
        }

    } catch (err) {
        errors.push({color: "alert-danger", msg: "something went wrong"});
        return  res.render("pages/dashboard", {errors, USER}); 
    }
    
    res.render('pages/dashboard', {errors, USER});
});



router.get('/editPass', (req, res) => {
    res.redirect('/users/dashboard');
});

// Change Password Handler
router.post('/editPass', (req, res) => {
    //! pull variables out of req.body
    const {lastPassword, newPassword1, newPassword2} = req.body;

    let errors = [];

    let USER = req.session.user;

    // check empty fields
    if (!lastPassword || !newPassword1 || !newPassword2) {
        errors.push({ color: 'alert-warning' , msg: "Fill all fields please" });
        res.render('pages/dashboard', {errors, USER});
    } else {
        //check password length
        if (newPassword1.length < 8) {
            errors.push({ color: 'alert-warning' , msg: "Password must contain at least 8 characters" });
        }
        //check new passwords match
        if (newPassword1 != newPassword2) {
            errors.push({ color: 'alert-warning' , msg: "New Passwords didn't match" });
        } else {
            // compare last password with user's password
            bcrypt.compare(lastPassword, USER.password, (err, isMatch) => {
                if (err) throw err;

                // last password matched to user's password
                if (isMatch) {
                    //! hash password
                    bcrypt.genSalt(10, (err, salt) => {
                        bcrypt.hash(newPassword1, salt, (err, hashed) => {
                            if (err) throw err;
                            // find user and update the password
                            User.findByIdAndUpdate(USER._id, {password: hashed}, (err, newUSer) => {
                                if (err) throw err;
                                if (newUSer) {
                                    //update session
                                    req.session.user = newUSer;
                                    USER = req.session.user;
                                    errors.push({color: 'alert-success', msg: "Your password updated successfully"});

                                    res.render('pages/dashboard', {errors, USER});
                                };
                            });

                        });
                    });
                } else {
                    //Incorrect current password
                    errors.push({ color: 'alert-danger' , msg: "Incorrect current password" });
                };
            });
        };

        res.render('pages/dashboard', {errors, USER});
    };
});


//logout router
router.get('/logout', (req, res) => {
    res.clearCookie('user_sid');
    res.redirect('/users/login');
});

router.get("/writeArticle", (req, res) => {
    const USER = req.session.user;
    let errors = [];
    res.render('pages/dashboard', {USER, errors});
});

router.post("/writeArticle", (req, res) => {
    
    const title = req.body.articleTitle;
    const text = req.body.articleText;
    
    console.log("title", title)
    console.log("text", text)

    
    let USER = req.session.user;

    let errors = [];

    const textLength = text.split(' ').length;    

    // get first 50 WORDS and join them with SPACE
    const summaryGenerator = (str) => str.split(/\s+/).slice(0,50).join(" ") + " . . . ";

    if (!title || !text) {
        errors.push({color: "alert-warning", msg: "Fill all article fields"});
    }
    if (textLength < 100) {
        errors.push({color: "alert-warning", msg: "Article Text is too short"});
    }

    if (errors.length > 0) {
        res.render('pages/dashboard', {USER, errors});
    } else {
        let  summary = summaryGenerator(text);
        console.log("summary", summary)

        const NEW_ARTICLE = new Article ({
            title,
            summary,
            text,
            author: USER._id
        });
        // console.log("NEW_ARTICLE", NEW_ARTICLE)
        
        NEW_ARTICLE.save()
        .then((article) => {
            errors.push({color: "alert-success", msg: "Article saved successfully"});
            res.render('pages/dashboard', {USER, errors});
        })
        .catch((err) => {
            console.log("Save Article error: ", err);
            errors.push({color: "alert-danger", msg: "Something went wrong when saving article"});
            res.render('pages/dashboard', {USER, errors});
        });
    };
});


module.exports = router;