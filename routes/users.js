"use strict";
var express = require('express');
var router = express.Router();



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
    if (path.extname(file.originalname) !== ".png" && ".jpeg" && ".jpg" && ".gif") {
      return callback(null, flase);
    }
    callback(null, true);
  },
  limits: {
    fileSize: 2000000
  }
});

// For save article image.
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
      return callback(null, flase);
    }
    callback(null, true);
  },
  limits: {
    fileSize: 2000000
  }
});
//********************* //
/* GET users listing. */
router.get('/', function(req, res, next) {
  req.flash("success_msg", "شما ثبت نام کردید و میتوانید وارد شوید");
  res.redirect("/");


});

module.exports = router;
