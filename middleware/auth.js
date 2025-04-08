function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated() || req.session.admin) {
    // 各リクエストごとにセッションの有効期限を 30 日に延長する
    req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30日分のミリ秒
    return next();
  }
  res.redirect('/login');
}

module.exports = { ensureAuthenticated };
