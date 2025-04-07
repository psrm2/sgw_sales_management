const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');
const DataRecord = require('../models/DataRecord');

// ダッシュボード（カレンダー、グラフ、タブ）
router.get('/dashboard', ensureAuthenticated, (req, res) => {
  res.render('dashboard', { user: req.user });
});

// 個数入力画面：日付をクエリパラメータで受け取り、該当日の保存データを取得
router.get('/input_quantity', ensureAuthenticated, async (req, res) => {
  const date = req.query.date;
  let record = await DataRecord.findOne({ user: req.user._id, date: date });
  res.render('input_quantity', { date: date, user: req.user, record: record });
});

// 運賃編集画面
router.get('/settings', ensureAuthenticated, (req, res) => {
  res.render('settings', { user: req.user });
});

module.exports = router;
