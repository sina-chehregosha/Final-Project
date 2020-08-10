const express = require("express");
const router = express.Router();
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
        console.log("bloggers", typeof Bloggers, Bloggers);
        // TODO: How to find just bloggers' articles?
        const Articles = await Article.find({});
        console.log("Articles 0 author", Articles[0]._doc.author.toString(), typeof Articles[0]._doc.author)
        
        res.render('pages/adminDashboard', {ADMIN, Messages, Bloggers, Articles});
    } catch(err) {
        console.log("Error finding Bloggers",err);
    }
    
});











module.exports = router;