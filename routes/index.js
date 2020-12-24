var express = require('express');

var router = express.Router();

const Post = require('../Models/Post');
const User = require('../Models/User');
const Comment = require('../Models/Comment');

const path = require("path");
const bcrypt = require("bcryptjs");
const passport = require('passport');

const moment = require('jalali-moment');

const fs = require('fs');

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
    fs.unlinkSync("./public/images/profileImages/" + req.file.filename);
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
      newUser.profileImage = "/images/profileImages/" + req.file.filename;
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


//********************* << Article Page Handle >> *********************//
router.get("/article/:id", (req, res) => {
  let postKey = [];
  let variable = 0;

  for (let i = 0; req.path[i] != null; i++) {
    if (req.path[i] === "/") {
      variable++;
    }
    if (variable === 2) {
      if (req.path[i] != "/") {
        postKey.push(req.path[i]);
      }
    }
  }

  postKey = postKey.join("");
  Post.findOne({
    _id: postKey
  })
    .then(post => {
      post["time"] = moment(post.createdAt, 'YYYY/MM/DD').locale('fa').format('YYYY/MM/DD');
      let userLoggedIn = 0;
      if (req.user) userLoggedIn = 1;
      Comment.find({
        post: postKey
      })
        .then((comments) => {
          res.render("article", {
            post,
            userLoggedIn,
            comments
          });
        })
    })
    .catch(err => console.log(err));
});
//********************* //

// /authorArticles/<%= posts[post]['author'].userName%>

//********************* << Article Page Handle >> *********************//
router.post("/addComment", (req, res, next) => {
  let flag = 0;
  if (req.body.comment == '') {
    req.flash("error_msg", "لطفا نظرت رو بنویس");
    res.redirect("/article/" + req.body.postId);
  }
  else {
    const newComment = new Comment({
      comment: req.body.comment,
      post: req.body.postId
    });
    if (req.user) {
      newComment.userName = req.user.userName;
      flag = 1;
    }
    else {
      if(req.body.userName == '') {
        req.flash("error_msg", "لطفا اسمت رو بنویس");
        res.redirect("/article/" + req.body.postId);
      }
      else {
        newComment.userName = req.body.userName;
        flag = 1;
      }
    }
    if(flag = 1) {
      newComment.save();
      req.flash("success_msg", "نظرت با موفقیت ثبت شد");
      res.redirect("/article/" + req.body.postId);
    }
  }
});
//********************* //

//********************* << Author Articles Handle >> *********************//
router.get("/authorArticles/:id", (req, res) => {
  let postKey = [];
  let variable = 0;
  for (let i = 0; req.path[i] != null; i++) {
    if (req.path[i] === "/") {
      variable++;
    }
    if (variable === 2) {
      if (req.path[i] != "/") {
        postKey.push(req.path[i]);
      }
    }
  }
  postKey = postKey.join("");
  User.findOne({
    userName: postKey
  })
    .then(user => {
      Post.find({
        author: user._id
      })
        .then(posts => {
          lastActivity = moment(user.updatedAt, 'YYYY/MM/DD').locale('fa').format('YYYY/MM/DD');
          posts.forEach(post => {
            post["time"] = moment(post.createdAt, 'YYYY/MM/DD').locale('fa').format('YYYY/MM/DD');
          });
          res.render('authorArticles', {
            user,
            name: req.user.userName,
            posts,

          });
        })
    })
});
//********************* //

//********************* << Articles by article keys Handle >> *********************//
router.get("/articlesBy/:word(([\\u0600-\\u06FF]+\\s?)+$)", (req, res) => {
  let postKey = [];
  let variable = 0;
  console.log('req.path :>> ', req.path);
  for (let i = 0; req.path[i] != null; i++) {
    if (req.path[i] === "/") {
      variable++;
    }
    if (variable === 2) {
      if (req.path[i] != "/") {
        postKey.push(req.path[i]);
      }
    }
  }
  postKey = postKey.join("");
  console.log('postKey :>> ', postKey);
      Post.find({
         articleKeys: { "$in" : [postKey]}  
      }).populate(
        'author', { userName: 1, description: 1, profileImage: 1 })
          .then(posts => {
            posts.forEach(post => {
              post["time"] = moment(post.createdAt, 'YYYY/MM/DD').locale('fa').format('YYYY/MM/DD');
            }); 
                let checkExistPost = 0;
                if (posts.length == 0) checkExistPost = 1;
                console.log('posts :>> ', posts);
                res.render('postByArticleKeys', {
                  postKey,
                  posts,
                  checkExistPost
                });
          })
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
