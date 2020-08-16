const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs")

//User Model
const User = require("../models/User");
const { findByIdAndUpdate, find, findByIdAndDelete } = require("../models/User");

//Article Model
const Article = require('../models/Article');

router.get("/", (req,res) => {
    res.redirect("/users/adminDashboard");
})

router.post("/", async (req,res) => {

    const {bloggerId} = req.body;

    try {
        const BLOGGER = await User.findById(bloggerId);
        const ARTICLES =await Article.find({author: bloggerId});
        res.render("pages/bloggerInfo", {BLOGGER, ARTICLES});
    } catch (err) {
        console.log("error happened on loading one blogger's articles. Error: ", err);
        res.redirect("/users/adminDashboard");
    }

});

router.get("/articleInfo", (req,res) => {
    res.redirect("/users/adminDashboard");
});

router.post("/articleInfo", async (req, res) => {

    const {articleId} = req.body;

    try {
        const ARTICLE = await Article.findById(articleId);
        const bloggerId = ARTICLE._doc.author;
        res.render("pages/articleInfoAdmin", {ARTICLE, bloggerId});
    } catch(err) {
        console.log("error happened on loading one article's info. Error: ", err);
        res.redirect("/users/adminDashboard");
    }

});

router.get("/deleteArticle", (req,res) => {
    res.redirect("/users/adminDashboard");
});

router.post("/deleteArticle", async (req, res) => {
    const {articleId} = req.body;
    await Article.findByIdAndDelete(articleId);
    res.redirect("/users/adminDashboard");
});

router.get("/resetPassword", (req,res) => {
    res.redirect("/users/adminDashboard");
});

router.post("/resetPassword", async (req, res) => {
    const {bloggerId} = req.body;
    try {
        let BLOGGER = await User.findById(bloggerId);
        const Mobile = BLOGGER._doc.mobileNumber;
        await bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(Mobile, salt, async (err, hashed) => {
                if (err) throw err;
                await User.findByIdAndUpdate(bloggerId, {password: hashed})
                .then(()=> {
                    console.log(`Password Reset Done: ${BLOGGER._doc.email}`);
                    res.redirect("/users/adminDashboard");
                }).catch(err => {
                    throw err
                })
            })
        })
    
    } catch(err) {
        console.log(err);
        res.redirect("/users/adminDashboard");
    }
});

router.get("/deleteUser", (req,res) => {
    res.redirect("/users/adminDashboard");
});

router.post("/deleteUser", async (req, res) => {
    const {bloggerId} = req.body;
    console.log(bloggerId);
    try {
        await User.findByIdAndDelete(bloggerId)
        .then(async () => {
            await Article.deleteMany({author: bloggerId}).then(() => {
                res.redirect("/users/adminDashboard");
            })
        });
    } catch (err) {
        console.log("error while deleting the user! Error: ", err);
        res.redirect("/users/adminDashboard");
    }
});


module.exports = router;