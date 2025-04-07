const express = require('express');
const router = express.Router();
const User = require('../models/User');
const DataRecord = require('../models/DataRecord');
const { ensureAuthenticated } = require('../middleware/auth');

// 管理者認証ミドルウェア（簡易実装例）
function ensureAdmin(req, res, next) {
  // ここでは、クライアント側で管理者パスワード認証が完了している前提とします
  next();
}

// 登録済みユーザー一覧表示
router.get('/users', ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    const users = await User.find({}, 'username').exec();
    res.render('admin_users', { users });
  } catch (e) {
    res.status(500).send('ユーザー一覧の取得に失敗しました');
  }
});

// 選択したユーザーのカレンダー表示（閲覧専用）
router.get('/calendar', ensureAuthenticated, ensureAdmin, async (req, res) => {
  const userId = req.query.userId;
  if (!userId) {
    return res.status(400).send('userId が指定されていません');
  }
  try {
    const user = await User.findById(userId).exec();
    if (!user) return res.status(404).send('ユーザーが見つかりません');
    res.render('admin_calendar', { user });
  } catch (e) {
    res.status(500).send('ユーザー情報の取得に失敗しました');
  }
});

// ユーザー削除用ルート：該当ユーザーとその関連データを完全削除
router.post('/deleteUser', ensureAuthenticated, ensureAdmin, async (req, res) => {
  const userId = req.body.userId;
  if (!userId) {
    return res.status(400).json({ error: 'userId が指定されていません' });
  }
  try {
    // ユーザーの削除
    await User.findByIdAndDelete(userId);
    // 該当ユーザーのデータ（DataRecord）の削除
    await DataRecord.deleteMany({ user: userId });
    res.json({ message: 'ユーザーとそのデータを削除しました' });
  } catch (e) {
    res.status(500).json({ error: 'ユーザー削除に失敗しました' });
  }
});

module.exports = router;
