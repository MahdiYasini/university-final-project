"use strict";
var express = require('express');
var router = express.Router();

const path = require("path");

const bcrypt = require("bcryptjs");

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


/* GET users listing. */
router.get('/', function (req, res, next) {
  req.flash("success_msg", "شما ثبت نام کردید و میتوانید وارد شوید");
  res.redirect("/");
});

module.exports = router;
