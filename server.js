require('dotenv').config();
const https = require('https');
const fs = require('fs');
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

// MongoDB 接続
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/sgw_sales', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// ミドルウェア設定
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

app.use(session({ 
  secret: process.env.SESSION_SECRET || 'secretkey', 
  resave: false, 
  saveUninitialized: false,
  cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 } // 30日間有効
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

// Passport 設定（async/await 対応）
passport.use(new LocalStrategy(async (username, password, done) => {
  try {
    const user = await User.findOne({ username: username }).exec();
    if (!user) return done(null, false, { message: 'ユーザー名が見つかりません' });
    if (!user.verifyPassword(password)) return done(null, false, { message: 'パスワードが正しくありません' });
    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));
passport.serializeUser((user, done) => {
  done(null, user.id);
});
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).exec();
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// 各ルート設定
const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');
const viewRoutes = require('./routes/view');
const adminRoutes = require('./routes/admin');

app.use('/', authRoutes);
app.use('/', viewRoutes);
app.use('/api', apiRoutes);
app.use('/admin', adminRoutes);

// ルート "/" へのアクセス時のリダイレクト処理
app.get('/', (req, res) => {
  if (req.isAuthenticated() || req.session.admin) {
    res.redirect('/dashboard');
  } else {
    res.redirect('/login');
  }
});

// HTTPS サーバーのオプション設定（プライベートキーと証明書のパスを指定）
const options = {
  key: fs.readFileSync('/root/ssl/cf.key'),
  cert: fs.readFileSync('/root/ssl/cf.pem')
};

const PORT = process.env.PORT || 443;
https.createServer(options, app).listen(PORT, () => {
  console.log(`HTTPS Server started on port ${PORT}`);
});
