// TODO: Reset Password
// TODO: Delete User


const express = require("express");
const router = express.Router();

//User Model
const User = require("../models/User");
const { findByIdAndUpdate, find } = require("../models/User");

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
})

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

router.post("/deleteArticle", async (req, res) => {
    const {articleId} = req.body;
    await Article.findByIdAndDelete(articleId);
    res.redirect("/users/adminDashboard");
});

module.exports = router;