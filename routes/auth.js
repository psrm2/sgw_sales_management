const express = require('express');
const passport = require('passport');
const User = require('../models/User');
const router = express.Router();

// ログイン画面表示
router.get('/login', (req, res) => {
  res.render('login', { message: req.flash('error') });
});

// ログイン処理
router.post('/login', passport.authenticate('local', {
  successRedirect: '/dashboard',
  failureRedirect: '/login',
  failureFlash: true
}));

// 登録画面表示
router.get('/register', (req, res) => {
  res.render('register', { message: req.flash('error') });
});

// 登録処理
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

// ログアウト
router.get('/logout', (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
    res.redirect('/login');
  });
});

module.exports = router;
