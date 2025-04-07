const express = require('express');
const router = express.Router();
const DataRecord = require('../models/DataRecord');
const { ensureAuthenticated } = require('../middleware/auth');

// ユーザーごとのデータ取得（ログインユーザー）
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

// データの新規作成／更新（ユーザーごと）
router.post('/record', ensureAuthenticated, async (req, res) => {
  const { date, quantities } = req.body; // quantities は JSON オブジェクト
  try {
    let record = await DataRecord.findOne({ user: req.user._id, date: date });
    if (record) {
      record.quantities = quantities;
    } else {
      record = new DataRecord({ user: req.user._id, date: date, quantities: quantities });
    }
    await record.save();
    res.json({ message: '保存しました' });
  } catch (e) {
    res.status(500).json({ error: 'データ保存に失敗しました' });
  }
});

module.exports = router;
