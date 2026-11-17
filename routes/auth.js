const router = require("express").Router();
const wrapAsync = require("../middleware/async");
const auth = require("../controllers/authController");
router.get("/admin/login", auth.loginForm);
router.post("/admin/login", wrapAsync(auth.login));
router.post("/admin/logout", auth.logout);
module.exports = router;
