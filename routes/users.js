const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");

//User Model
const User = require("../models/User");

//GET login page
router.get("/login", (req, res) => {
  console.log(req.session.user)
  res.render("pages/login", { errors: "There is NO error" });
});

//GET Register page
router.get("/register", (req, res) => {
  res.render("pages/register", { errors: "There is NO error" });
});

//Register Handle
router.post("/register", (req, res) => {
  console.log(req.body);
  //!pull variables out of req.body
  const {
    firstName,
    lastName,
    password,
    password2,
    sex,
    mobileNumber,
    email,
  } = req.body;

  let errors = [];

  //Check Required Fields
  if (
    !firstName ||
    !lastName ||
    !email ||
    !password ||
    !password2 ||
    !mobileNumber
  ) {
    errors.push({ msg: "Please fill in all fields!" });
  }

  if (!sex) {
    errors.push({ msg: "Please select your gender" });
  }

  //Check password match
  if (password !== password2) {
    errors.push({ msg: "Passwords do not match!" });
  }

  //TODO: Check Password Strength
  //Check password length
  if (password.length < 8) {
    errors.push({ msg: "Password should be at least 8 characters" });
  }

  //TODO: Check mobile number with regex

  if (errors.length > 0) {
    // console.log("errors: ", errors);
    // errors.forEach(error => console.log(error.msg));
    // console.log("first name: ",firstName);
    // console.log("last name: ", lastName);
    // console.log("email: ", email);
    // console.log("password: ", password);
    // console.log("password2: ", password2);
    // console.log("mobile number: ", mobileNumber);
    // console.log("gender: ", sex);
    // res.render("pages/register", { errors });
    res.render("pages/register", {
      errors,
      firstName,
      lastName,
      password,
      password2,
      mobileNumber,
      email
    });
  } else {
    //Validation Passed

    //Check Mobile then Email

    //check mobile
    User.findOne({ mobileNumber: mobileNumber }).then((mobile) => {
      if (mobile) {
        //Mobile number exist
        errors.push({ msg: "Mobile number already exist" });
        res.render("pages/register", { errors });
      } else {
        //Check Email
        User.findOne({ email: email }).then((user) => {
          if (user) {
            //Email Exist
            errors.push({ msg: "Email already exist" });
            res.render("pages/register", { errors, firstName, lastName, password, password2, mobileNumber, email });
          } else {
            const NEW_USER = new User({
              // In ES5 we said name: name
              //(in exercises we did not have line 23 and we should have said name: req.body.name)
              // and here, in ES6, we could just pass the variables
              firstName,
              lastName,
              password,
              sex,
              mobileNumber,
              email,
            });

            //* We don't want to save passwords as plain text. so we don't save it like below
            // NEW_USER.save((err, user) => {
            //   if (err) return res.status(500).send('Something went wrong when saving user');
            //   return res.send(`User ${firstName} created Successfully. \n Email: ${email}`);
            // });

            console.log("test");

            //! Hash Password
            bcrypt.genSalt(10, (err, salt) => {
              bcrypt.hash(NEW_USER.password, salt, (err, hashed) => {
                if (err) throw err;
                // set password to hashed
                NEW_USER.password = hashed;

                //*save user using promise.
                NEW_USER.save()
                  //redirect to login page
                  .then((user) => {
                    //TODO: Flash message
                    res.redirect("/users/login");
                  })
                  .catch((err) => {
                    console.log(err);
                    //TODO: Flash message
                    res.redirect("/users/register");
                  });
              });
            });
          }
        });
      }
    });
  }
});

router.post("/login", (req, res) => {

  //! pull variables out of req.body
  const {email, password} = req.body;

  let errors = [];

  //check required fields
  if (!email) errors.push({msg: "Please enter your email"});
  if (!password) errors.push({msg: "Please enter your password"});

  if(errors.length > 0) {
    res.render("pages/login", {errors, email});  
  } else {
    //find user
    User.findOne({email: email})
    .then(theUser => {
      if(!theUser) errors.push({msg: "Email does not exist!"});
      else {
        //match password
        bcrypt.compare(password, theUser.password, (err, isMatch) => {
          if(err) throw err;
          if(isMatch) {
            //set session
            req.session.user = theUser;
            res.render("pages/dashboard", {theUser});
          }
        });
      }
    })
    .catch(err => console.log(err));
  }
})

module.exports = router;
