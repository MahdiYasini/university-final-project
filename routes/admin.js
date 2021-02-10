"use strict";
var express = require('express');
var router = express.Router();

const path = require("path");

const User = require('../Models/User');
const Post = require('../Models/Post');


const moment = require('jalali-moment');

let advanceMenuBar = "admin";

//********************* <<Handle logout request >> *********************//
router.get("/logout", (req, res) => {
    req.logout();
    req.flash("success_msg", "با موفقیت خارج شدید به امید دیدار");
    res.clearCookie("session");
    res.redirect("/");
});
//********************* //

//********************* <<Handle Dashboard request >> *********************//
router.get('/', (req, res) =>
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
        res.render('adminDashboard', {
            advanceMenuBar,
            posts,
            checkExistPost
        });
    })
    .catch(err => console.log(err))
);
//********************* //

//********************* <<Handle All users request >> *********************//
router.get('/allUsers', (req, res) =>
    User.find({})
    .then((users) => {
        let checkExistUser = 0;
        if (users.length == 0) checkExistUser = 1;
        res.render('allUsers', {
            advanceMenuBar,
            users,
            checkExistUser
        });
    })
    .catch(err => console.log(err))

);
//********************* //

//********************* <<suspend request >> *********************//
router.get("/suspendAccount/:id", (req, res) => {
    let errors = [];
    let userId = [];
    let variable = 0;
    for (let i = 0; req.path[i] != null; i++) {
        if (req.path[i] === "/") {
            variable++;
        }
        if (variable === 2) {
            if (req.path[i] != "/") {
                userId.push(req.path[i]);
            }
        }
    }
    userId = userId.join("");
    User.findOne({
            _id: userId
        })
        .then(user => {
            user.suspend = true;
            user.save();
        })
        .catch(err => console.log(err))

    req.flash("success_msg", "کاربر با موفیقیت معلق شد");
    res.redirect("/admin/allUsers");
})
//********************* //

//********************* <<Active account request >> *********************//
router.get("/activatedAccount/:id", (req, res) => {
    let userId = [];
    let variable = 0;
    for (let i = 0; req.path[i] != null; i++) {
        if (req.path[i] === "/") {
            variable++;
        }
        if (variable === 2) {
            if (req.path[i] != "/") {
                userId.push(req.path[i]);
            }
        }
    }
    userId = userId.join("");
    User.findOne({
            _id: userId
        })
        .then(user => {
            user.suspend = false;
            user.save();
        })
        .catch(err => console.log(err))
    req.flash("success_msg", "کاربر با موفیقیت فعال شد");
    res.redirect("/admin/allUsers");

})
//********************* //

//********************* <<Delete user request >> *********************//
router.get("/deleteAccount/:id", (req, res) => {
    let userId = [];
    let variable = 0;
    for (let i = 0; req.path[i] != null; i++) {
        if (req.path[i] === "/") {
            variable++;
        }
        if (variable === 2) {
            if (req.path[i] != "/") {
                userId.push(req.path[i]);
            }
        }
    }
    userId = userId.join("");
    Post.deleteMany({
            author: userId
        })
        .then(() => {
            User.findOneAndDelete({
                _id: userId
            })
        })
        .catch(err => console.log(err))
    req.flash("success_msg", "کاربر با موفیقیت حذف شد");
    res.redirect("/admin/allUsers");
})
//********************* //

//********************* <<Delete user request >> *********************//
router.get("/deleteAccount/:id", (req, res) => {
    let userId = [];
    let variable = 0;
    for (let i = 0; req.path[i] != null; i++) {
        if (req.path[i] === "/") {
            variable++;
        }
        if (variable === 2) {
            if (req.path[i] != "/") {
                userId.push(req.path[i]);
            }
        }
    }
    userId = userId.join("");
    User.findOneAndDelete({
            _id: userId
        })
        .then(deletedResult => {
            Post.findByIdAndDelete({
                author: userId
            })
        })
        .catch(err => console.log(err))
    req.flash("success_msg", "کاربر با موفیقیت حذف شد");
    res.redirect("/admin/allUsers");
})
//********************* //

//********************* <<Delete Post >> *********************//
router.get("/deletePost/:id", (req, res) => {
    let userId = [];
    let variable = 0;
    for (let i = 0; req.path[i] != null; i++) {
        if (req.path[i] === "/") {
            variable++;
        }
        if (variable === 2) {
            if (req.path[i] != "/") {
                userId.push(req.path[i]);
            }
        }
    }
    userId = userId.join("");
    Post.findOneAndDelete({
            _id: userId
        })
        .then(deletedResult => {
            Post.findByIdAndDelete({
                author: userId
            })
        })
        .catch(err => console.log(err))
    req.flash("success_msg", "خاطره با موفیقیت حذف شد");
    res.redirect("/admin");
})
//********************* //
module.exports = router;