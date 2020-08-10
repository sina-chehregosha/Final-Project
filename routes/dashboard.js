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
const Article = require('../models/Article');

router.get('/', (req, res) => {

    const USER = req.session.user;
    const ARTICLE = req.session.article;
    let errors = [];

    res.render('pages/dashboard', {USER, errors, ARTICLE});
    
});

router.get('/editInfo', (req, res) => {
    res.redirect('/users/dashboard');
});

// Change user's information handler
router.post('/editInfo', async (req, res) => {
    
    //! pull variables out of req.body
    const { firstName, lastName, email, mobileNumber } = req.body;
    
    let USER = req.session.user;
    const ARTICLE = req.session.article;

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
            res.render('pages/dashboard', {USER, errors, ARTICLE});
        } else {
            res.render('pages/dashboard', {USER, errors, ARTICLE});
        }

    } catch (err) {
        errors.push({color: "alert-danger", msg: "something went wrong"});
        res.render('pages/dashboard', {USER, errors, ARTICLE});
    }
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
    const ARTICLE = req.session.article;


    // check empty fields
    if (!lastPassword || !newPassword1 || !newPassword2) {
        errors.push({ color: 'alert-warning' , msg: "Fill all fields please" });
        res.render('pages/dashboard', {USER, errors, ARTICLE});
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
            bcrypt.compare(lastPassword, USER.password, async (err, isMatch) => {
                if (err) throw err;

                // last password matched to user's password
                if (isMatch) {
                    //! hash password
                    bcrypt.genSalt(10, (err, salt) => {
                        bcrypt.hash(newPassword1, salt, (err, hashed) => {
                            if (err) throw err;
                            // find user and update the password
                            User.findByIdAndUpdate(USER._id, {password: hashed}, async (err, newUSer) => {
                                if (err) throw err;
                                if (newUSer) {
                                    //update session
                                    req.session.user = newUSer;
                                    USER = req.session.user;
                                    errors.push({color: 'alert-success', msg: "Your password updated successfully"});

                                    res.render('pages/dashboard', {USER, errors, ARTICLE});
                                };
                            });

                        });
                    });
                } else {
                    //Incorrect current password
                    errors.push({ color: 'alert-danger' , msg: "Incorrect current password" });
                    res.render('pages/dashboard', {USER, errors, ARTICLE});
                };
            });
        };

    };
});


//logout router
router.get('/logout', (req, res) => {
    res.clearCookie('user_sid');
    res.redirect('/users/login');
});

router.get("/writeArticle", (req, res) => {
    res.redirect('/users/dashboard');
});

router.post("/writeArticle", async (req, res) => {
    
    const title = req.body.articleTitle;
    const text = req.body.articleText;
    
    let USER = req.session.user;
    let ARTICLE = req.session.article;

    let errors = [];

    const textLength = text.split(' ').length;    

    // get first 50 WORDS and join them with SPACE
    const summaryGenerator = (str) => str.split(/\s+/).slice(0,90).join(" ") + " . . . ";

    if (!title || !text) {
        errors.push({color: "alert-warning", msg: "Fill all article fields"});
    }
    if (textLength < 100) {
        errors.push({color: "alert-warning", msg: "Article Text is too short"});
    }

    if (errors.length > 0) {
        res.render('pages/dashboard', {USER, errors, ARTICLE});
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
        .then(async (article) => {
            errors.push({color: "alert-success", msg: "Article saved successfully"});
            try {
                ARTICLE = await Article.find({author: USER._id});
                res.render('pages/dashboard', {USER, errors, ARTICLE});
            } catch (err) {
                errors.push({color: "alert-danger", msg: "Something went wrong when loading user's articles"});
                ARTICLE = [];
                res.render('pages/dashboard', {USER, errors, ARTICLE});
            } 
        })
        .catch(async (err) => {
            console.log("Save Article error: ", err);
            errors.push({color: "alert-danger", msg: "Something went wrong when saving article"});
            try {
                ARTICLE = await Article.find({author: USER._id});
                res.render('pages/dashboard', {USER, errors, ARTICLE});
            } catch (err) {
                errors.push({color: "alert-danger", msg: "Something went wrong when loading user's articles"});
                ARTICLE = [];
                res.render('pages/dashboard', {USER, errors, ARTICLE});
            }
        });
    };
});

// FIXME: Multer does not work
router.post("/editAvatar", (req, res) => {

    //if user send empty request
    // if(req.body.length == undefined) return res.redirect('/users/dashboard');

    let errors = [];

    if(req.session.user.avatar !== '/images/noProfilePicture.png') {
        try {
            fs.unlinkSync(`../public/${req.session.user.avatar}`)
        } catch(err) {
            errors.push({color: 'alert-danger', msg: 'Something went wrong on deleting last avatar'});
        }
    }
    const upload = uploadAvatar.single('avatar');
    upload(req, res, (err) => {
        if (err) errors.push({color: 'alert-danger', msg: 'Something went wrong on uploading avatar'});
        console.log(req.file);
        User.findByIdAndUpdate(req.session.user._id, {avatar: req.file.filename}, {new: true},
            (err, updatedUser) => {
                if (err) errors.push({color: 'alert-danger', msg: 'Something went wrong on updating avatar'});
                else if (updatedUser) {
                    errors.push({color: 'alert-success', msg: 'Avatar updated successfully'});
                    //update session
                    req.session.user = updatedUser;
                } 

                const USER = req.session.user;
                const ARTICLE = req.session.article;


                res.render('pages/dashboard', {errors, USER, ARTICLE} );
            }
        )
    })
});

router.get("/contactAdmin", (req, res) => {
    res.redirect('/users/dashboard');
});

router.post("/contactAdmin", (req, res) => {
    const {contactFormTitle, contactFormMessage} = req.body;

    let USER = req.session.user;
    let ARTICLE = req.session.article;

    let errors = [];
    User.findOne({role: 'admin'}, (err, admin) => {
        if (err) {
            errors.push({color: "alert-danger", msg: "Error while finding admin user"});
            return res.render('pages/dashboard', {USER, errors, ARTICLE});
        }
        else {
            //* use Article schema as admin message
            const NEW_ADMIN_MSG = new Article({
                title: contactFormTitle ,
                summary: USER.email,
                text: contactFormMessage,
                author: admin._doc._id
            });
            NEW_ADMIN_MSG.save((err, msg) => {
                if (err) {
                    errors.push({color: "alert-danger", msg: "Error while sending message to admin"});
                    return res.render('pages/dashboard', {USER, errors, ARTICLE});    
                }
                errors.push({color: "alert-success", msg: "Message sent to admin successfully"});
                return res.render('pages/dashboard', {USER, errors, ARTICLE});    
            });
        };
    });
    
});

module.exports = router;