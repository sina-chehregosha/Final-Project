//TODO: SEARCH

const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const multer = require('multer');
const fs = require('fs');

// to avoid DDoS attack on search:
function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

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
const Article = require('../models/Article');
const { dir } = require("console");

router.get('/', async (req, res) => {
    let ARTICLE = [];
    const USER = req.session.user;
    if (req.query.search) {
        // to avoid DDoS Attack:
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
        // regex is our searching phrase now
        console.log("Search: ", regex);
        try {
            let userTemp; // temporary variable for users
            let articleTemp; // temporary variable for articles
            let usersIds = [];

            // search in users
            userTemp = await User.find({$or: [{firstName: regex}, {lastName: regex}, {email: regex}]});

            // if some user matched => show matched users' articles
            if (userTemp.length > 0) {
                for (let i=0; i<userTemp.length; i++) {
                    // push model id's into usersIds to find their articles
                    await usersIds.push(userTemp[i]._doc._id);
                }
                for (let i=0; i<usersIds.length; i++) {
                    // find articles of found users
                    articleTemp = await Article.find({author: usersIds[i]});
                    for (let n=0; n<articleTemp.length; n++) {
                        ARTICLE.push(articleTemp[n]);
                    }
                }
                console.log(ARTICLE);
                articleTemp = []; // clear it to use in article search
            }

            // FixMe: Search in article text does not work
            // search in Articles
            articleTemp = Article.find({$text: {$search: regex, $caseSensitive: false}});
            console.log(articleTemp);
            
            let errors = [];
            res.render('pages/dashboard', {USER, errors, ARTICLE});        
        } catch (err) {
            let errors = [{color: "alert-warning", msg: "Sorry! Something went wrong on searching"}];
            ARTICLE = req.session.article;
            res.render("pages/dashboard", {USER, ARTICLE, errors});
        }
    } else {
        ARTICLE = req.session.article;
        let errors = [];
        res.render('pages/dashboard', {USER, errors, ARTICLE});    
    }

    // const USER = req.session.user;
    // const ARTICLE = req.session.article;
    // console.log(ARTICLE);
    // let errors = [];

    // res.render('pages/dashboard', {USER, errors, ARTICLE});    
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

        if (mobileNumber !== USER.mobileNumber && mobileNumber !== "" && mobileNumber.length > 7) {
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

// Write Article Handler
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
        // console.log("summary", summary)

        const NEW_ARTICLE = new Article ({
            title,
            summary,
            text,
            author: USER._id
        });
        
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
        // console.log(req.file);
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

// Contact Admin Handler
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
                title: USER.email ,
                summary: contactFormTitle , //! message title is in summery
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

router.get('/articleInfo', (req, res) => {
    res.redirect('/users/dashboard');
});

// Article Info page router
router.post("/articleInfo", async (req, res) => {
    const {articleId} = req.body;
    try {
        const ARTICLE = await Article.findById(articleId);
        res.render("pages/articleInfo", {ARTICLE});  
    } catch (err) {
        console.log("something went wrong when finding an article to show article info");
        res.redirect("/users/dashboard");
    }
});

router.get('/editArticle', (req, res) => {
    res.redirect('/users/dashboard');
});

//Edit Article Handler
router.post("/editArticle", async (req, res) => {
    const {articleTitle, articleText, articleId} = req.body;

    const USER = req.session.user;
    let ARTICLE = req.session.article;

    let errors = [];

    const textLength = articleText.split(' ').length;    

    // get first 50 WORDS and join them with SPACE
    const summaryGenerator = (str) => str.split(/\s+/).slice(0,90).join(" ") + " . . . ";

    if(!articleTitle || !articleText) {
        errors.push({color: "alert-warning", msg: "Fill all article fields"});
    }
    if (textLength < 100) {
        errors.push({color: "alert-warning", msg: "Article Text is too short"});
    }

    if (errors.length > 0) {
        res.render('pages/dashboard', {USER, errors, ARTICLE});
    } else {
        let summary = summaryGenerator(articleText);
        try {
            await Article.findByIdAndUpdate(articleId, {summary: summary, title: articleTitle, text: articleText});
            errors.push({color: "alert-success", msg: "Article edited successfully"})
            ARTICLE = await Article.find({author: USER._id});
            req.session.article = ARTICLE;
            res.render("pages/dashboard", {USER, ARTICLE, errors});
        } catch (err) {
            errors.push({color: 'alert-danger', msg: "Something went wrong when updating the article"});
            res.render("pages/dashboard", {USER, ARTICLE, errors});
        }
    }
});

router.get('/deleteArticle', (req, res) => {
    res.redirect('/users/dashboard');
});

// Delete Article Handler
router.post("/deleteArticle", async (req, res) => {
    const {articleId} = req.body;
    const USER = req.session.user;
    let ARTICLE = req.session.article;

    let errors = [];

    try {
        await Article.findByIdAndDelete(articleId)
        .then(async () => {
            try {
                ARTICLE = await Article.find({author: USER._id});
                req.session.article = ARTICLE;
                errors.push({color: "alert-success", msg: "Article Deleted successfully"})
                res.render('pages/dashboard', {USER, errors, ARTICLE});
            } catch (err) {
                errors.push({color: "alert-danger", msg: "Something went wrong when setting article session. BUT article has been deleted from the database!"});
                res.render('pages/dashboard', {USER, errors, ARTICLE});
            }
        });
    } catch (err) {
        errors.push({color: "alert-danger", msg: "Something went wrong when deleting article"});
        res.render('pages/dashboard', {USER, errors, ARTICLE});
    }
});

// A-Z sort handler
router.get("/sortAZ", async (req, res) => {
    let ARTICLE = req.session.article;
    console.log(ARTICLE);
    const USER = req.session.user;

    let errors = [];

    try {
        ARTICLE = await Article.find({author: USER._id}).sort({title: 'asc'});
        errors.push({color: 'alert-success', msg: "Articles sorted A-Z successfully"});
        res.render('pages/dashboard', {USER, errors, ARTICLE});
    } catch (err) {
        errors.push({color: 'alert-danger', msg: "Something went wrong when sorting articles A-Z"});
        res.render('pages/dashboard', {USER, errors, ARTICLE});
    }

});

//Date sort handler
router.get("/sortDate", async (req, res) => {
    let ARTICLE = req.session.article;
    console.log(ARTICLE);
    const USER = req.session.user;
    let errors = [];

    try {
        ARTICLE = await Article.find({author: USER._id}).sort({date: 'desc'});
        errors.push({color: 'alert-success', msg: "Articles sorted by date successfully"});
        res.render('pages/dashboard', {USER, errors, ARTICLE});
    } catch (err) {
        errors.push({color: 'alert-danger', msg: "Something went wrong when sorting articles by date"});
        res.render('pages/dashboard', {USER, errors, ARTICLE});
    }

});

module.exports = router;