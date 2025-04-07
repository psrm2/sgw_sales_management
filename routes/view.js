const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');

// ダッシュボード（カレンダー、グラフ、タブ）
router.get('/dashboard', ensureAuthenticated, (req, res) => {
  res.render('dashboard', { user: req.user });
});

// 個数入力画面（例： /input_quantity?date=2024-12-01 ）
router.get('/input_quantity', ensureAuthenticated, (req, res) => {
  res.render('input_quantity', { date: req.query.date, user: req.user });
});

// 運賃編集画面
router.get('/settings', ensureAuthenticated, (req, res) => {
  res.render('settings', { user: req.user });
});

module.exports = router;
