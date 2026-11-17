function requireAdmin(req, res, next) {
  if (!req.session.adminId) {
    req.flash("error", "Please sign in to access the admin area.");
    return res.redirect("/admin/login");
  }
  next();
}
module.exports = { requireAdmin };
