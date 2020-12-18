"use strict";
var express = require('express');
var router = express.Router();

const path = require("path");

const User = require('../Models/User');
const Post = require('../Models/Post');

//********************* <<Setup Multer for save file in local storage>> *********************//
const multer = require("multer");
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
router.get('/dashboard',  (req, res) =>
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
                if(blogPost.length == 0 ) checkExistPost = 1;
                res.render('dashboard', {
                    name: req.user.userName,
                    blogPost: blogPost,
                    checkExistPost: checkExistPost
                });
            })

    })
    .catch(err => console.log(err))
)


/* GET users listing. */
router.get('/', function (req, res, next) {
  req.flash("success_msg", "شما ثبت نام کردید و میتوانید وارد شوید");
  res.redirect("/");
});

module.exports = router;
