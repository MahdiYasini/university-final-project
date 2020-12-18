var express = require('express');

var router = express.Router();

const Post = require('../Models/Post');
const User = require ('../Models/User');

const { ensureAuthenticated } = require('../config/auth');


//! بعد از اینکه قسمت افزودن خاطره رو ایجاد کردی حتما چک کن حتما حتما
// /* GET home page. */
// router.get('/', function (req, res, next) {
//   Post.find({}).populate("author", { userName: 1 }).exec((err, posts) => {
//     res.render('homepage', {
//       blogPost: posts
//     })
//   });
// });

//! کد داشبورد برای پیدا کردن نام نویسنده های پست باید بهینه بشه 
//! نیاز به اصلاح داره 
router.get('/dashboard', ensureAuthenticated, (req, res) =>
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

module.exports = router;
