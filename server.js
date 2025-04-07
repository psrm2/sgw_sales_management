require('dotenv').config();
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
app.use(bodyParser.json()); // JSON ボディのパースを有効化
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

app.use(session({ 
  secret: process.env.SESSION_SECRET || 'secretkey', 
  resave: false, 
  saveUninitialized: false 
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

// ルート設定
const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');
const viewRoutes = require('./routes/view');

app.use('/', authRoutes);
app.use('/', viewRoutes);
app.use('/api', apiRoutes);

// ルート "/" へのアクセスはログインページへリダイレクト
app.get('/', (req, res) => {
  res.redirect('/login');
});

// 特権ポートで動作させる場合、setcap 等で node に権限を付与済みであれば通常ユーザーで起動可
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
