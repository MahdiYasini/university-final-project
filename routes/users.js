"use strict";
var express = require('express');
var router = express.Router();

const path = require("path");

const User = require('../Models/User');
const Post = require('../Models/Post');

const bcrypt = require("bcryptjs");

const fs = require('fs');

//********************* <<Functions>> *********************//
const checkExistEmail = async (email) => {
  console.log('emailChange :>> ', email);
  const user = await User.findOne({ email: email }, { email: 1 })
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
    if (path.extname(file.originalname) !== ".png" && ".gif" && ".jpg" && ".jpeg") {
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
  Post.find({})
    .then((blogPost) => {
      User.find({})
        .then((user) => {
          for (data1 in blogPost) {
            for (data2 in user) {
              if (blogPost[data1].author == user[data2]._id) {
                blogPost[data1].userName = user[data2].userName;
              }
            }
          }
          let checkExistPost = 0;
          if (blogPost.length == 0) checkExistPost = 1;
          res.render('dashboard', {
            name: req.user.userName,
            blogPost: blogPost,
            checkExistPost: checkExistPost
          });
        })

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
      if (req.body.userNameChange && user.userName!= req.body.userNameChange) {
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
        }
        else {
          user.email = req.body.emailChange;
        }
      }
      //? Change Password
      if (req.body.oldPassword && req.body.newPassword) {
        let setUp = await compareAsync(req.body.oldPassword, req.body.newPassword)
        if (setUp == true) {
          req.flash("error_msg", "رمز قدیمی اشتباه وارد شده");
        }
        else {
          if (req.body.newPassword.length < 6) {
            req.flash("error_msg", "رمز عبور حداقل باید 6 حرف (کارکتر) باشد");
          }
          else if (req.body.newPassword === req.body.oldPassword) {
            req.flash("error_msg", "رمز جدید باید با رمز قدیمی متفاوت باشد");
          }
          else if (req.body.newPassword != req.body.confirmNewPassword) {
            req.flash("error_msg", "تکرار رمز عبور اشتباه است");
          }
          else {
            user.password = await hashPassword(req.body.newPassword)
          }
        }
      }
      //? Change Profile picture
      if(req.file){
        if(user.profileImage != "/images/profileImages/defaultImage/profile.png") {
            fs.unlinkSync("./public" + user.profileImage);
            user.profileImage = "/images/profileImages" + req.file.filename;
        }
        else {
          user.profileImage =  "/images/profileImages" + req.file.filename;
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

/* GET users listing. */
router.get('/', function (req, res, next) {
  req.flash("success_msg", "شما ثبت نام کردید و میتوانید وارد شوید");
  res.redirect("/");
});

module.exports = router;
