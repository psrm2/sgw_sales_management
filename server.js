const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const flash = require('connect-flash');
const mongoose = require('mongoose');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const path = require('path');
const User = require('./models/User');

const app = express();

// MongoDB 接続（MongoDB がローカルで稼働している場合）
mongoose.connect('mongodb://localhost:27017/sgw_sales', { useNewUrlParser: true, useUnifiedTopology: true });

// ミドルウェア設定
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

app.use(session({ secret: 'secretkey', resave: false, saveUninitialized: false }));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

// Passport 設定
passport.use(new LocalStrategy(function(username, password, done) {
  User.findOne({ username: username }, function(err, user) {
    if (err) return done(err);
    if (!user) return done(null, false, { message: 'ユーザー名が見つかりません' });
    if (!user.verifyPassword(password)) return done(null, false, { message: 'パスワードが正しくありません' });
    return done(null, user);
  });
}));
passport.serializeUser(function(user, done) {
  done(null, user.id);
});
passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

// ルート設定
const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');
app.use('/', authRoutes);
app.use('/api', apiRoutes);

app.get('/dashboard', ensureAuthenticated, (req, res) => {
  res.render('dashboard', { user: req.user });
});

// 認証チェックミドルウェア
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect('/login');
}

app.listen(3000, () => {
  console.log('Server started on http://localhost:3000');
});
