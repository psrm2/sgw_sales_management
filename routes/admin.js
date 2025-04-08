const express = require('express');
const router = express.Router();
const User = require('../models/User');
const DataRecord = require('../models/DataRecord');

// 管理者アクセス用ミドルウェア
function ensureAdminAccess(req, res, next) {
  if (req.session.admin || (req.user && req.user.role === 'admin')) {
    return next();
  }
  res.redirect('/login');
}

// 管理者用ログインルート：クエリパラメータ pass による認証
router.get('/login', (req, res) => {
  const pass = req.query.pass;
  if (pass === "momoadmin") {
    req.session.admin = true;
    res.redirect('/admin/users');
  } else {
    res.send('管理者パスワードが正しくありません');
  }
});

// 登録済みユーザー一覧表示
router.get('/users', ensureAdminAccess, async (req, res) => {
  try {
    const users = await User.find({}, 'username').exec();
    res.render('admin_users', { users });
  } catch (e) {
    res.status(500).send('ユーザー一覧の取得に失敗しました');
  }
});

// 選択したユーザーのカレンダー表示（閲覧専用）
router.get('/calendar', ensureAdminAccess, async (req, res) => {
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
router.post('/deleteUser', ensureAdminAccess, async (req, res) => {
  const userId = req.body.userId;
  if (!userId) {
    return res.status(400).json({ error: 'userId が指定されていません' });
  }
  try {
    await User.findByIdAndDelete(userId);
    await DataRecord.deleteMany({ user: userId });
    res.json({ message: 'ユーザーとそのデータを削除しました' });
  } catch (e) {
    res.status(500).json({ error: 'ユーザー削除に失敗しました' });
  }
});

module.exports = router;
