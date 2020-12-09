var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

const flash = require('connect-flash');

const session = require('express-session');
const cookieSession = require('cookie-session');
const cookieKey = require('./config/Key');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

//********************* <<setup cookie and session>> *********************//
app.use(cookieSession({
  maxAge: 24 * 60 * 1000,
  keys: [cookieKey.key]
}));

// Express Session
app.use(session({
  secret: "secret",
  resave: true,
  saveUninitialized: true,
}));
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
app.use('/users', usersRouter);
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
