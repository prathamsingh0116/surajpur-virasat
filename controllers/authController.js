const bcrypt = require("bcryptjs");
const Admin = require("../models/Admin");

exports.loginForm = (req, res) => res.render("auth/login", { title: "Admin Login" });

exports.login = async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  const admin = await Admin.findOne({ email });
  if (!admin || !(await bcrypt.compare(password, admin.password))) {
    req.flash("error", "Invalid email or password.");
    return res.redirect("/admin/login");
  }
  req.session.adminId = admin._id.toString();
  req.session.adminName = admin.name;
  req.flash("success", "Welcome to the admin dashboard.");
  res.redirect("/admin");
};

exports.logout = (req, res) => req.session.destroy(() => res.redirect("/admin/login"));
