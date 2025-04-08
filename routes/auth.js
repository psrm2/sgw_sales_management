const express = require('express');
const passport = require('passport');
const User = require('../models/User');
const router = express.Router();

// ログイン画面表示（既にログイン済みならダッシュボードにリダイレクト）
router.get('/login', (req, res) => {
  if (req.isAuthenticated() || req.session.admin) {
    return res.redirect('/dashboard');
  }
  res.render('login', { message: req.flash('error') });
});

// ログイン処理
router.post('/login', passport.authenticate('local', {
  successRedirect: '/dashboard',
  failureRedirect: '/login',
  failureFlash: true
}));

// ユーザー登録画面表示（既にログイン済みならダッシュボードにリダイレクト）
router.get('/register', (req, res) => {
  if (req.isAuthenticated() || req.session.admin) {
    return res.redirect('/dashboard');
  }
  res.render('register', { message: req.flash('error') });
});

// ユーザー登録処理
router.post('/register', async (req, res) => {
  try {
    const user = new User({
      username: req.body.username,
      password: req.body.password,
      role: req.body.role || 'user'
    });
    await user.save();
    res.redirect('/login');
  } catch (e) {
    req.flash('error', '登録に失敗しました');
    res.redirect('/register');
  }
});

// ログアウト処理：セッション破棄とクッキー削除
router.get('/logout', (req, res, next) => {
  req.logout(function(err) {
    if (err) return next(err);
    req.session.destroy(function(err) {
      if (err) return next(err);
      res.clearCookie('connect.sid'); // セッション用クッキー名（通常は 'connect.sid'）
      res.redirect('/login');
    });
  });
});

module.exports = router;
