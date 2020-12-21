"use strict";
var express = require('express');
var router = express.Router();

const path = require("path");

const User = require('../Models/User');
const Post = require('../Models/Post');

const bcrypt = require("bcryptjs");

const fs = require('fs');

const moment = require('jalali-moment');


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
//! کد داشبورد برای پیدا کردن نام نویسنده های پست باید بهینه بشه 
//! نیاز به اصلاح داره 
//! باید یه پست ایجاد کنی تا بتونی تغییرات رو انجام بدی
router.get('/dashboard', (req, res) =>
  Post.find({}).populate(
      'author', { userName: 1, description: 1, profileImage: 1 })
    .then((posts) => {
      posts.forEach(post => {
        post["time"] = moment(post.createdAt, 'YYYY/MM/DD').locale('fa').format('YYYY/MM/DD');
      });
      // console.log('posts :>> ', posts[0].createdAt.split('T'));

          let checkExistPost = 0;
          if (posts.length == 0) checkExistPost = 1;
          res.render('dashboard', {
            name: req.user.userName,
            posts,
            checkExistPost
          });
    })
    .catch(err => console.log(err))
);
//********************* //

//********************* <<Handle Dashboard request >> *********************//
//**** Edit profile page request
router.get('/editProfile', (req, res) => {
  res.render("editProfile", {
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
    //! بعد از اینکه پست اضافه کردی حواست باشه برای نشون دادن زمان پست به صورت شمسی باید کد های زیر رو اعمال کنیم 
    // for (var data in posts) {
    //   //Set Hour
    //   let setHour = posts[data].date.getHours() - 3;
    //   if (setHour < 0) {
    //     setHour += 24;
    //   }

    //   //Set Minute
    //   let setMinute = posts[data].date.getMinutes() - 30;
    //   if (setMinute < 0) {
    //     setMinute += 60;
    //     setHour -= 1;
    //   }

    //   //Set Second
    //   let setSecond = posts[data].date.getSeconds();
    //   if (setSecond < 0) {
    //     setSecond += 60;
    //     setMinute -= 1;
    //   }

    //   posts[data]["time"] = `${setHour}:${setMinute}:${setSecond}`;
    //   posts[data]["dateCalender"] = moment(`${posts[data].date.getFullYear()}/${posts[data].date.getMonth()}/${posts[data].date.getDate()}`, "YYYY/MM/DD").locale("fa").format("YYYY/MM/DD");
    // }
    res.render("myArticles", {
      blogPost: posts,
      checkExistPost: checkExistPost
    });
  });
});
//********************* //


//********************* << Add Article Handle >> *********************//
//**** Add Article Page request
router.get("/addArticle", (req, res) => {
  res.render("addArticle");
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
  // Check required fields
  if (
    subject === "" ||
    summery === "" ||
    article === ""
  ) {
    fs.unlinkSync("./public/images/postImages/" + req.file.filename);
    errors.push({
      msg: "لطفا اطلاعات قسمت‌هایی که با ستاره مشخص شده‌اند را کامل کنید"
    });
    res.render("addArticle", {
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
      articleKeys
    });
    //? If user wrote articleKeys 
    if (articleKeys) {
      newPost.articleKeys = articleKeys.split(' ');
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
  }
});
//********************* //



/* GET users listing. */
router.get('/', function (req, res, next) {
  req.flash("success_msg", "شما ثبت نام کردید و میتوانید وارد شوید");
  res.redirect("/");
});

module.exports = router;