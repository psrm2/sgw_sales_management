function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated() || req.session.admin) {
    return next();
  }
  res.redirect('/login');
}
module.exports = { ensureAuthenticated };
