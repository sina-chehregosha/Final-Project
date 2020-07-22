const express = require("express");
const router = express.Router();

router.get('/', (req, res) => {
    const USER = req.session.user;
    res.render('pages/dashboard', {USER});
});









module.exports = router;