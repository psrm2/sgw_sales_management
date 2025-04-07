const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');
const DataRecord = require('../models/DataRecord');

// ダッシュボード（カレンダー、グラフ、タブ）
router.get('/dashboard', ensureAuthenticated, (req, res) => {
  res.render('dashboard', { user: req.user });
});

// 個数入力画面：クエリパラメータ date を受け取り、フォーマットを統一して保存済みデータを取得
router.get('/input_quantity', ensureAuthenticated, async (req, res) => {
  const date = req.query.date;
  // フォーマットを "YYYY-MM-DD" に統一
  const formattedDate = new Date(date).toISOString().slice(0,10);
  let record = await DataRecord.findOne({ user: req.user._id, date: formattedDate });
  res.render('input_quantity', { date: formattedDate, user: req.user, record: record });
});

// 運賃編集画面
router.get('/settings', ensureAuthenticated, (req, res) => {
  res.render('settings', { user: req.user });
});

module.exports = router;
