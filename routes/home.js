const router = require("express").Router();
const wrapAsync = require("../middleware/async");
const homeController = require("../controllers/homeController");
const qrController = require("../controllers/qrController");
router.get("/", wrapAsync(homeController.index));
router.get("/location/:slug", wrapAsync(homeController.location));
router.get("/qr/:slug.svg", wrapAsync(qrController.svg));
router.get("/qr/:slug.png", wrapAsync(qrController.png));
module.exports = router;
