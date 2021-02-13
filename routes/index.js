var express = require('express');

var router = express.Router();

const Post = require('../Models/Post');
const User = require('../Models/User');
const Comment = require('../Models/Comment');
const Like = require('../Models/Like');

const path = require("path");
const bcrypt = require("bcryptjs");
const passport = require('passport');

const moment = require('jalali-moment');

const fs = require('fs');


// setup menubar
const checkUser = (userAccess) => {
  let advanceMenuBar = "guests";
  if (userAccess) {
    advanceMenuBar = "users";
  }
  if (userAccess && userAccess.userName === "Administrator") {
    advanceMenuBar = "admin";
  }
  return advanceMenuBar;
}


//********************* <<Setup Multer for save file in local storage>> *********************//
const multer = require("multer");
const {
  search
} = require('../config/DB');
//? For save profile image.
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
    //? if (path.extname(file.originalname) !== ".png" && ".jpeg" && ".jpg" && ".gif")
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
//********************* //

//********************* <<Handle Registering request >> *********************//
//**** Register Page request
router.get("/register", (req, res) => {
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
  //? Define for add probable errors.
  let errors = [];
  //? Check required fields
  if (!userName || !email || !password || !password2) {
    errors.push({
      msg: "لطفااطلاعات را کامل کنید"
    });
  };
  //? Check matching passwords
  if (password !== password2) {
    errors.push({
      msg: "تکرار رمز صحیح نیست"
    });
  };
  //? Check password length
  if (password.length < 6) {
    errors.push({
      msg: "حداقل 6 حرف (کارکتر) برای رمز"
    });
  }
  //? Check any error exist or not.
  if (errors.length > 0) {
    if (req.file) fs.unlinkSync("./public/images/profileImages/" + req.file.filename);
    res.render("register", {
      advanceMenuBar,
      errors,
      userName,
      email,
      password,
      password2
    });
  } else {
    //! We have to use else because solve the error of the below  
    //? Cannot set headers after they are sent to the client
    //? Validation for existence user 
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
    //? Validation for existence email 
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
    //? Create new user
    const newUser = new User({
      userName,
      email,
      password,
    });
    //? If user upload profile picture
    if (req.file) {
      newUser.profileImage = "/images/profileImages/" + req.file.filename;
    }
    //? If user has own description
    if (req.body.description) {
      newUser.description = req.body.description
    }
    //? Hashing password
    bcrypt.genSalt(10, (err, salt) =>
      bcrypt.hash(password, salt, (err, hash) => {
        if (err) throw err;
        newUser.password = hash;
        //? Save user to DB.
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
  } else res.render("login");
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
      Like.findOne({
          post: postKey
        })
        .then(postLikes => {
          post["time"] = moment(post.createdAt, 'YYYY/MM/DD').locale('fa').format('YYYY/MM/DD');
          let userLoggedIn = 0;
          if (req.user) userLoggedIn = 1;
          Comment.find({
              post: postKey
            })
            .then((comments) => {
              if (postLikes == null) postLikes = 0;
              else postLikes = postLikes.counted;

              let checkUserLoggedIn = 0;
              if (req.user) checkUserLoggedIn = 1;
              res.render("article", {
                advanceMenuBar: checkUser(req.user),
                post,
                userLoggedIn,
                comments,
                postLikes: postLikes,
                checkUserLoggedIn
              });
            })
        })
    })
    .catch(err => console.log(err));
});
//********************* //

//********************* << Article Page Handle >> *********************//
router.post("/addComment", (req, res, next) => {
  let flag = 0;
  if (req.body.comment == '') {
    req.flash("error_msg", "لطفا نظرت رو بنویس");
    res.redirect("/article/" + req.body.postId);
  } else {
    const newComment = new Comment({
      comment: req.body.comment,
      post: req.body.postId
    });
    if (req.user) {
      newComment.userName = req.user.userName;
      flag = 1;
    } else {
      if (req.body.userName == '') {
        req.flash("error_msg", "لطفا اسمت رو بنویس");
        res.redirect("/article/" + req.body.postId);
      } else {
        newComment.userName = req.body.userName;
        flag = 1;
      }
    }
    if (flag = 1) {
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
      _id: postKey
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
          let checkExistsPosts = 0;
          if (posts.length == 0) checkExistsPosts = 1;
          res.render('authorArticles', {
            advanceMenuBar: checkUser(req.user),
            checkExistsPosts,
            user,
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
  Post.find({
      articleKeys: {
        "$in": [postKey]
      }
    }).populate(
      'author', {
        userName: 1,
        description: 1,
        profileImage: 1
      })
    .then(posts => {
      posts.forEach(post => {
        post["time"] = moment(post.createdAt, 'YYYY/MM/DD').locale('fa').format('YYYY/MM/DD');
      });
      let checkExistPost = 0;
      if (posts.length == 0) checkExistPost = 1;
      res.render('postByArticleKeys', {
        advanceMenuBar: checkUser(req.user),
        postKey,
        posts,
        checkExistPost
      });
    })
});
//********************* //

//********************* << Add Like to the post >> *********************//
router.post("/addLike/:id", (req, res) => {
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
  Like.findOne({
      post: postKey
    })
    .then(likeInformation => {
      if (!likeInformation) {
        const newLikeInformation = new Like({
          post: req.body.postId,
          users: [req.user._id],
          counted: 1
        });
        req.flash("success_msg", "شما این خاطره را پسندیدی");
        newLikeInformation.save();
      } else {
        const checkUserLikedPost = likeInformation.users.find(element => element == req.user.id);
        if (checkUserLikedPost) {
          req.flash("error_msg", "قبلا این خاطره را پسندیدی");
        } else {
          req.flash("success_msg", "شما این خاطره را پسندیدی");
          likeInformation.users.push(req.user._id)
          likeInformation.counted = likeInformation.counted + 1;
          likeInformation.save();
        }
      }
      res.redirect(`/article/${req.body.postId}`);
    })
});
//********************* //

//********************* << Homepage Handle >> *********************//
router.get('/', function (req, res, next) {
  if (req.user) res.redirect('dashboard');
  else {
    Post.find({}).populate(
        'author', {
          userName: 1,
          description: 1,
          profileImage: 1
        })
      .then((posts) => {
        posts.forEach(post => {
          post["time"] = moment(post.createdAt, 'YYYY/MM/DD').locale('fa').format('YYYY/MM/DD');
        });
        let checkExistPost = 0;
        if (posts.length == 0) checkExistPost = 1;
        res.render('mainPage', {
          advanceMenuBar: checkUser(req.user),
          posts,
          checkExistPost
        });
      })
      .catch(err => console.log(err))
  }
});
//********************* //

//********************* << search Handle >> *********************//
router.post("/search", function (req, res, next) {
  process.setMaxListeners(0);
  let replace = req.body.searchField;
  let searchString = new RegExp(replace);
  Post.find({
    $or: [{
      "subject": {
        $regex: searchString,
        $options: 'i'
      }
    }, {
      "article": {
        $regex: searchString,
        $options: 'i'
      }
    }, {
      "summery": {
        $regex: searchString,
        $options: 'i'
      }
    }]
  })
  .populate(
    'author', {
      userName: 1,
      description: 1,
      profileImage: 1
    })
  .then(posts => {
    let checkExistPost = 0;
    if (posts.length == 0) checkExistPost = 1;
    res.render('searchResult', {
      postKey: req.body.searchField,
      advanceMenuBar: checkUser(req.user),
      posts,
      checkExistPost
    });
  });
})

//********************* << Admin Handle >> *********************//
router.get("/adminLogin", (req, res) => {
  res.render("adminLogin")
})

router.post("/adminLogin", (req, res, next) => {
  passport.authenticate("local", {
    successRedirect: "/admin",
    failureRedirect: "/adminLogin",
    failureFlash: true
  })(req, res, next);
});
//********************* //
module.exports = router;