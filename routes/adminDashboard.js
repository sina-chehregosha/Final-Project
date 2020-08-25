const express = require("express");
const router = express.Router();
const multer = require('multer');
const fs = require('fs');

const bloggerInfoRouter = require("./bloggerInfo");

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

//User Model
const User = require("../models/User");
const { findByIdAndUpdate, find } = require("../models/User");

//Article Model
//* We Use Articles as Admin Messages
const Article = require('../models/Article');

router.get('/', async (req, res) => {

    const ADMIN = req.session.user;
    const Messages = req.session.article;

    try {
        const Bloggers = await User.find({role:'blogger'});
        //?? How to find just bloggers' articles?
        const Articles = await Article.find({});
        
        res.render('pages/adminDashboard', {ADMIN, Messages, Bloggers, Articles});
    } catch(err) {
        console.log("Error finding Bloggers",err);
    }
    
});

//logout router
router.get('/logout', (req, res) => {
    res.clearCookie('user_sid');
    res.redirect('/users/login');
});

router.get("/deleteMessage", (req, res) => {
    res.redirect('/users/adminDashboard');
});

router.post("/deleteMessage", async (req, res) => {
    const {messageId} = req.body;

    try {
        await Article.findByIdAndDelete(messageId);
        res.redirect('/users/adminDashboard');
        // FIXME: Show deleted message after delete from database
    } catch (err) {
        console.log("Something went wrong when deleting a message. Error: ", err);
        res.redirect('/users/adminDashboard');
    }
    
});


router.use("/bloggerInfo", bloggerInfoRouter);



module.exports = router;