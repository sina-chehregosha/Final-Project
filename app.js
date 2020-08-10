const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const mongoose = require('mongoose');
const session = require('express-session');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');

const app = express();
const Config = require('./config/config');

// FIXME: Initialization Not working
// require('./tools/initialization')(); 

//Connect to Database
mongoose.connect(Config.MongoAddr, {
  useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true, //solve mongoose deprecation error
    useFindAndModify: false //solve mongoose findOne deprecation
})
.then(() => console.log("MongoDB Connected..."))
.catch(err => console.log(err));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));   //Morgan middle-ware
app.use(express.json());  //body-parser
app.use(express.urlencoded({ extended: false })); //special type of body parser
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public'))); //Make "public" folder static

//Express Session
app.use(session({
  key: 'user_sid',
  secret: "secret key",
  resave: false,
  saveUninitialized: false,
  cookie:{
    // secure: true,
  }
}));

// clear user_sid if there where no session for it in server side
app.use(function(req, res, next) {
	if (req.cookies.user_sid && !req.session.user) {
		res.clearCookie("user_sid");
	};

	next();
});


//Routes
app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
});

module.exports = app;