const express = require('express');
const router = express.Router();
const DataRecord = require('../models/DataRecord');
const { ensureAuthenticated } = require('../middleware/auth');

// ユーザーごとのデータ取得
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

// データの新規作成／更新
router.post('/record', ensureAuthenticated, async (req, res) => {
  const { date, quantities } = req.body; // quantities は JSON 文字列またはオブジェクト
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

// 運賃取得（全ユーザー共通、例として固定値を返す）
let fares = {
  '一般宅配': 170,
  '代引き': 190,
  '着払い&クール': 190,
  '指定場所': 150,
  '160S': 300,
  '170S': 400,
  '180S': 500,
  '200S': 600,
  '集荷': 100,
  '商業': 100,
  'メール便': 40
};

router.get('/fares', ensureAuthenticated, (req, res) => {
  res.json(fares);
});

// 運賃更新（管理者またはログインユーザーが個人設定の場合）
router.post('/fares', ensureAuthenticated, async (req, res) => {
  // ここではシンプルに全ユーザー共通の運賃として更新
  fares = req.body; // JSON オブジェクトとして受信
  res.json({ message: '運賃を更新しました', fares: fares });
});

module.exports = router;
