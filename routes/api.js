const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const DataRecord = require('../models/DataRecord');
const { ensureAuthenticated } = require('../middleware/auth');

// ユーザーごとの入力データ取得
router.get('/records', ensureAuthenticated, async (req, res) => {
  try {
    const records = await DataRecord.find({ user: req.user._id });
    res.json(records);
  } catch (e) {
    res.status(500).json({ error: 'データ取得に失敗しました' });
  }
});

// 管理者向け：全ユーザーのデータ取得
router.get('/admin/records', ensureAuthenticated, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: '権限がありません' });
  }
  try {
    const records = await DataRecord.find().populate('user');
    res.json(records);
  } catch (e) {
    res.status(500).json({ error: 'データ取得に失敗しました' });
  }
});

// 入力データの新規作成／更新
router.post('/record', ensureAuthenticated, async (req, res) => {
  let { date, quantities } = req.body;
  console.log("Received date:", date);
  console.log("Received quantities:", quantities);

  if (!date) {
    return res.status(400).json({ error: "date は必須です" });
  }
  const d = new Date(date);
  if (isNaN(d)) {
    return res.status(400).json({ error: "無効な日付です" });
  }
  // 日付フォーマットを "YYYY-MM-DD" に統一
  const formattedDate = d.toISOString().slice(0, 10);
  console.log("Formatted date:", formattedDate);

  try {
    // 数量は文字列の場合もあるので数値に変換
    for (let key in quantities) {
      quantities[key] = parseInt(quantities[key], 10) || 0;
    }
    let record = await DataRecord.findOne({ user: req.user._id, date: formattedDate });
    if (record) {
      record.quantities = quantities;
    } else {
      record = new DataRecord({ user: req.user._id, date: formattedDate, quantities: quantities });
    }
    await record.save();
    res.json({ message: '保存しました' });
  } catch (e) {
    console.error("Error saving record:", e);
    res.status(500).json({ error: 'データ保存に失敗しました' });
  }
});

// GET: ログインユーザーの運賃取得
router.get('/fares', ensureAuthenticated, (req, res) => {
  res.json(req.user.fares);
});

// POST: ログインユーザーの運賃更新
router.post('/fares', ensureAuthenticated, async (req, res) => {
  try {
    req.user.fares = req.body; // req.body は運賃オブジェクト
    await req.user.save();
    res.json({ message: '運賃を更新しました', fares: req.user.fares });
  } catch (e) {
    res.status(500).json({ error: '運賃更新に失敗しました' });
  }
});

// POST: MongoDB 初期化（ログインユーザーが "deldb" の場合のみ）
router.post('/reset', ensureAuthenticated, async (req, res) => {
  if (req.user.username !== "deldb") {
    return res.status(403).json({ error: "Not authorized" });
  }
  try {
    await mongoose.connection.dropDatabase();
    res.json({ message: "MongoDB を初期化しました" });
  } catch (err) {
    console.error("Database reset error:", err);
    res.status(500).json({ error: "初期化に失敗しました" });
  }
});

module.exports = router;
