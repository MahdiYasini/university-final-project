//? In The Name Of God ?//

//? Github
//https://github.com/MahdiYasini/university-final-project

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

const flash = require('connect-flash');

const session = require('express-session');
const cookieSession = require('cookie-session');

const {cookieKey} = require('./config/securityKeys');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var adminRouter = require('./routes/admin');

var app = express();

const passport = require('passport');
const { ensureAuthenticated, ensureAdminAuthenticated } = require('./config/auth');


//********************* << For support persian (farsi) routing>> *********************//
//? In other hand Express routing non ascii characters (Farsi)
let unescape = require('querystring').unescape;
app.use((req, res, next) => {
  req.url = unescape(req.url);
  next();
});

//********************* <<setup cookie and session>> *********************//
app.use(cookieSession({
  maxAge: 24 * 60 * 1000,
  keys: [cookieKey]
}));

//**** Express Session
app.use(session({
  secret: "secret",
  resave: true,
  saveUninitialized: true,
}));
//********************* //

//********************* <<setup Passport>> *********************//
//! We have to setup passport code below the code to set user information (req.user) correctly.
require('./config/passport')(passport);
app.use(passport.initialize());
app.use(passport.session());
//********************* //

//********************* <<setup to access public folder>> *********************//
app.use(express.static(path.join(__dirname, 'public')));
//********************* //

//********************* <<Setup body parser middleware>> *********************//
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));
//app.use(bodyParser.json()) 
//********************* //

//********************* <<Setup Database>> *********************//
const mongoose = require('mongoose');
const DbUrl = require("./config/DB");
mongoose.set('useCreateIndex', true);
mongoose.connect(DbUrl, {
        useNewUrlParser: true, 
        useUnifiedTopology: true
    })
    .then(() => console.log('MongoDB Connected.'))
    .catch(err => {
      console.log(err);
      next(err);
    });
//********************* //

//********************* <<view engine setup>> *********************//
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
//********************* //

//********************* <<More setup>> *********************//
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
//********************* //

//********************* <<setup flash>> *********************//
// Connect Flash
app.use(flash());

// Globals Vars
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    next();
});
//********************* //

//********************* <<Routes>> *********************//
app.use('/', indexRouter);
app.use('/admin',ensureAdminAuthenticated, adminRouter);
app.use('/',ensureAuthenticated, usersRouter);
//********************* //

//********************* <<catch 404 and forward to error handler>> *********************//
app.use(function(req, res, next) {
  next(createError(404));
});

//********************* //

//********************* <<Error Handler>> *********************//
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  // render the error page
  res.status(err.status || 500);
  res.render('error');
});
//********************* //


module.exports = app;
