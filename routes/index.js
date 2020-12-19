var express = require('express');

var router = express.Router();

const Post = require('../Models/Post');
const User = require('../Models/User');

const path = require("path");
const bcrypt = require("bcryptjs");
const passport = require('passport');

//********************* <<Setup Multer for save file in local storage>> *********************//
const multer = require("multer");
// For save profile image.
let uploadProfileImage = multer({
  storage: multer.diskStorage({
    destination: function (req, file, callback) {
      callback(null, "public/images/profileImages");
    },
    filename: function (req, file, callback) {
      callback(
        null,
        file.fieldname + "-" + Date.now() + path.extname(file.originalname)
      );
    }
  }),
  fileFilter: function (req, file, callback) {
    console.log('file :>> ', file);
    //! The below code didn't work, I don't know why.
    // if (path.extname(file.originalname) !== ".png" && ".jpeg" && ".jpg" && ".gif")
    if (
      path.extname(file.originalname) !== ".png" &&
      path.extname(file.originalname) !== ".gif" &&
      path.extname(file.originalname) !== ".jpg" &&
      path.extname(file.originalname) !== ".jpeg"
    ) {
      return callback(null, flase);
    }
    callback(null, true);
  },
  limits: {
    fileSize: 7000000
  }
});



//********************* <<Handle Registering request >> *********************//
//**** Register Page request
router.get("/register", (req, res) => {
  console.log('req.user :>> ', req.user);
  if (req.user) {
    res.redirect("dashboard");
  } else {
    res.render("register");
  }
});

//**** Register request handle
router.post("/register", uploadProfileImage.single("profilePicture"), (req, res, next) => {
  const {
    userName,
    email,
    password,
    password2,
  } = req.body;

  //Define for add probable errors.
  let errors = [];

  // Check required fields
  if (!userName || !email || !password || !password2) {
    errors.push({
      msg: "لطفااطلاعات را کامل کنید"
    });
  };

  // Check matching passwords
  if (password !== password2) {
    errors.push({
      msg: "تکرار رمز صحیح نیست"
    });
  };

  //Check password length
  if (password.length < 6) {
    errors.push({
      msg: "حداقل 6 حرف (کارکتر) برای رمز"
    });
  }

  //Check any error exist or not.
  if (errors.length > 0) {
    res.render("register", {
      errors,
      userName,
      email,
      password,
      password2
    });
  }
  else {
    //! We have to use else because solve the error of the below  
    // Cannot set headers after they are sent to the client

    // Validation for existence user 
    User.findOne({
      userName: userName
    }).then(user => {
      if (user) {
        errors.push({
          msg: "نام کاربری قبلا ثبت نام کرده است"
        });
        res.render("register", {
          errors,
          userName,
          email,
          password,
          password2
        });
      }
    });

    // Validation for existence email 
    User.findOne({
      email: email
    }).then(user => {
      if (user) {
        errors.push({
          msg: "آدرس رایانامه قبلا ثبت شده است"
        });
        res.render("register", {
          errors,
          userName,
          email,
          password,
          password2
        });
      }
    });

    // Create new user
    const newUser = new User({
      userName,
      email,
      password,
    });

    // If user upload profile picture
    if (req.file) {
      newUser.profileImage = "/uploads/profile/" + req.file.filename;
    }

    // If user has own description
    if (req.body.description) {
      newUser.description = req.body.description
    }

    // Hashing password
    bcrypt.genSalt(10, (err, salt) =>
      bcrypt.hash(password, salt, (err, hash) => {
        if (err) throw err;
        newUser.password = hash;
        //Save user to DB.
        newUser
          .save()
          .then(user => {
            req.flash("success_msg", "شما ثبت نام کردید و میتوانید وارد شوید");
            res.redirect("/login");
          })
          .catch(err => console.log(err));
      })
    );
  }
});
//********************* //





//********************* <<Handle Login request >> *********************//
//**** Login Page request
router.get("/login", (req, res) => {
  if (req.user) {
    res.redirect('dashboard')
  }
  else res.render("login");
});

//**** Login request handle
router.post("/login", (req, res, next) => {
  passport.authenticate("local", {
    successRedirect: "/dashboard",
    failureRedirect: "/login",
    failureFlash: true
  })(req, res, next);
});
//********************* //





//! بعد از اینکه قسمت افزودن خاطره رو ایجاد کردی حتما چک کن حتما حتما
// /* GET home page. */
// router.get('/', function (req, res, next) {
//   Post.find({}).populate("author", { userName: 1 }).exec((err, posts) => {
//     res.render('homepage', {
//       blogPost: posts
//     })
//   });
// });

module.exports = router;
