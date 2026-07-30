const router = require("express").Router();
const protect = require("../middlewares/auth.middleware");
const controller = require("../controllers/watchlist.controller");

router.use(protect);
router.get("/", controller.listWatchlist);
router.get("/:providerId", controller.getWatchlistStatus);
router.put("/:providerId", controller.addToWatchlist);
router.delete("/:providerId", controller.removeFromWatchlist);

module.exports = router;
