"use strict";
var express = require('express');
var router = express.Router();

const path = require("path");

const User = require('../Models/User');
const Post = require('../Models/Post');

const bcrypt = require("bcryptjs");

const fs = require('fs');

const moment = require('jalali-moment');

const { telegram_api_token } = require('../config/securityKeys');
const { Telegraf, Markup, Extra } = require('telegraf')
const bot = new Telegraf(telegram_api_token)

// setup menubar
const checkUser =(userAccess) =>{
  let advanceMenuBar = "users";
  if(userAccess.userName === "Administrator") {
    advanceMenuBar = "admin";
  }
  return advanceMenuBar;
}


//********************* <<Functions>> *********************//
const checkExistEmail = async (email) => {
  const user = await User.findOne({
    email: email
  }, {
    email: 1
  })
  if (user) return 1;
  else return 0;
};

//? await doesn't wait for bcrypt.hash or bcrypt.compare because bcrypt.hash does not return a promise. 
//? So we will use bcrypt in a promise in order to use await.
//** Compare old and new password */
function compareAsync(oldPassword, newPassword) {
  return new Promise(function (resolve, reject) {
    bcrypt.compare(oldPassword, newPassword, function (err, res) {
      if (err) {
        reject(err);
      } else {
        resolve(res);
      }
    });
  });
}

//** Hashing new password */
async function hashPassword(newPasswordSendForHashing) {
  const hashedPassword = await new Promise((resolve, reject) => {
    bcrypt.hash(newPasswordSendForHashing, 10, function (err, hash) {
      if (err) reject(err)
      resolve(hash)
    });
  })
  return hashedPassword
}
//********************* //

//********************* <<Setup Multer for save file in local storage>> *********************//
const multer = require("multer");
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

//? For save article image.
let uploadArticleImage = multer({
  storage: multer.diskStorage({
    destination: function (req, file, callback) {
      callback(null, "public/images/postImages");
    },
    filename: function (req, file, callback) {
      callback(
        null,
        file.fieldname + "-" + Date.now() + path.extname(file.originalname)
      );
    }
  }),
  fileFilter: function (req, file, callback) {
    if (
      path.extname(file.originalname) !== ".png" &&
      path.extname(file.originalname) !== ".gif" &&
      path.extname(file.originalname) !== ".jpg" &&
      path.extname(file.originalname) !== ".jpeg"
    ) {
      return callback(null, false);
    }
    callback(null, true);
  },
  limits: {
    fileSize: 7000000
  }
});
//********************* //

//********************* <<Handle logout request >> *********************//
router.get("/logout", (req, res) => {
  req.logout();
  req.flash("success_msg", "با موفقیت خارج شدید به امید دیدار");
  res.clearCookie("session");
  res.redirect("/");
});
//********************* //

//********************* <<Handle Dashboard request >> *********************//
router.get('/dashboard', (req, res) =>{
  if(req.user.suspend === true) {
    req.logout();
    req.flash("error_msg", "طبق دستور کارگروه تا اطلاع ثانوی حساب کاربری شما معلق شده است");
    res.clearCookie("session");
    res.redirect("/");
  }

  Post.find({}).populate(
    'author', { userName: 1, description: 1, profileImage: 1 })
    .then((posts) => {
      posts.forEach(post => {
        post["time"] = moment(post.createdAt, 'YYYY/MM/DD').locale('fa').format('YYYY/MM/DD');
      });
      let checkExistPost = 0;
      if (posts.length == 0) checkExistPost = 1;
      res.render('dashboard', {
        advanceMenuBar: checkUser(req.user),
        name: req.user.userName,
        posts,
        checkExistPost
      });
    })
    .catch(err => console.log(err))
  });
//********************* //

//********************* <<Handle Dashboard request >> *********************//
//**** Edit profile page request
router.get('/editProfile', (req, res) => {
  res.render("editProfile", {
    advanceMenuBar: checkUser(req.user),
    userInformation: req.user
  });
});

//**** Edit profile page request
router.post('/editProfile', uploadProfileImage.single("profilePicture"), (req, res, next) => {
  User.findOne({
    _id: req.user._id
  })
    .then(async (user) => {
      //? Change username
      if (req.body.userNameChange && user.userName != req.body.userNameChange) {
        user.userName = req.body.userNameChange
        req.flash("success_msg", "تغییرات با موفقیت اعمال شد");
      }
      //? Change Comment
      if (req.body.commentChange) {
        user.description = req.body.commentChange;
        req.flash("success_msg", "تغییرات با موفقیت اعمال شد");
      }
      //? Change Email
      if (req.body.emailChange) {
        let check = await checkExistEmail(req.body.emailChange)
        if (check) {
          req.flash("error_msg", "رایانامه تکراری است");
        } else {
          user.email = req.body.emailChange;
        }
      }
      //? Change Password
      if (req.body.oldPassword && req.body.newPassword) {
        let setUp = await compareAsync(req.body.oldPassword, req.body.newPassword)
        if (setUp == true) {
          req.flash("error_msg", "رمز قدیمی اشتباه وارد شده");
        } else {
          if (req.body.newPassword.length < 6) {
            req.flash("error_msg", "رمز عبور حداقل باید 6 حرف (کارکتر) باشد");
          } else if (req.body.newPassword === req.body.oldPassword) {
            req.flash("error_msg", "رمز جدید باید با رمز قدیمی متفاوت باشد");
          } else if (req.body.newPassword != req.body.confirmNewPassword) {
            req.flash("error_msg", "تکرار رمز عبور اشتباه است");
          } else {
            user.password = await hashPassword(req.body.newPassword)
          }
        }
      }
      //? Change Profile picture
      if (req.file) {
        if (user.profileImage != "/images/profileImages/defaultImage/profile.png") {
          fs.unlinkSync("./public" + user.profileImage);
          user.profileImage = "/images/profileImages/" + req.file.filename;
        } else {
          user.profileImage = "/images/profileImages/" + req.file.filename;
        }
        req.flash("success_msg", "تغییرات با موفقیت اعمال شد");
      }
      user.save();
    })
    .then(() => {
      res.redirect('/editProfile');
    })
    .catch(err => console.log(err));
});
//********************* //

//********************* <<Handle myArticles request >> *********************//
router.get("/myArticles", (req, res) => {
  Post.find({
    author: req.user._id
  }).then(posts => {
    let checkExistPost = 0;
    if (posts.length == 0) checkExistPost = 1;
    posts.forEach(post => {
      post["time"] = moment(post.createdAt, 'YYYY/MM/DD').locale('fa').format('YYYY/MM/DD');
    });
    res.render("myArticles", {
      advanceMenuBar: checkUser(req.user),
      posts,
      checkExistPost: checkExistPost
    });
  });
});
//********************* //

//********************* << Add Article Handle >> *********************//
//**** Add Article Page request
router.get("/addArticle", (req, res) => {
  res.render("addArticle", {
    advanceMenuBar: checkUser(req.user),
  });
});

//**** Add Article request handle
router.post("/addArticle", uploadArticleImage.single("postImage"), (req, res) => {
  const {
    subject,
    summery,
    article,
    articleKeys,
  } = req.body;

  let errors = [];
  //? Check required fields
  if (
    subject === "" ||
    summery === "" ||
    article === ""
  ) {
    if(req.file) fs.unlinkSync("./public/images/postImages/" + req.file.filename);
    errors.push({
      msg: "لطفا اطلاعات قسمت‌هایی که با ستاره مشخص شده‌اند را کامل کنید"
    });
    res.render("addArticle", {
      advanceMenuBar: checkUser(req.user),
      errors,
      subject,
      summery,
      article,
      articleKeys
    });
  } else {
    const newPost = new Post({
      subject,
      summery,
      article,
    });
    //? If user wrote articleKeys 
    if (articleKeys) {
      let arrayOfArticleKeys;
      arrayOfArticleKeys = articleKeys.split(' ');
      arrayOfArticleKeys = arrayOfArticleKeys.filter(function (str) {
        return /\S/.test(str);
      });
      if (arrayOfArticleKeys.length) {
        newPost.articleKeys = arrayOfArticleKeys;
      }
    }
    //? If user send profile picture
    if (req.file) {
      newPost.image = "/images/postImages/" + req.file.filename;
    }
    //? Set user id for author information
    newPost.author = req.user._id;
    //? Save to DB
    newPost
      .save()
      .then(() => {
        req.flash("success_msg", "به خاطراتمون اضافه شد!");
        res.redirect("/dashboard");
      })
      .catch(err => console.log(err));
    //? Check to share in telegram channel
    if (req.body.shareToTelegramChannel) {
      const keyboard = Markup.inlineKeyboard([
        Markup.urlButton("بزن بریم", `https://www.zoomit.ir/`, 0),
      ]);
      bot.telegram.sendMessage(
        '@SafarNameThePlaceForWriteAMemory',
        `\n ________________________
        ✈️✈️✈️✈️✈️\n 
        ________________________
          خاطره ای جدید منتشر شد \n 
          ${moment(new Date(), 'YYYY/MM/DD').locale('fa').format('YYYY/MM/DD')} \n 
          ${newPost.subject}\n
          ${newPost.summery}\n 
          به قلم ${req.user.userName} \n
          ________________________
          \n✈️✈️✈️✈️✈️\n`,
        Extra.markdown().markup(keyboard)
      );
    }
  }
});
//********************* //

// //********************* << 404 Handle >> *********************//
router.get('*', function(req, res){
    res.status(404).render('404Page');
});


module.exports = router;