const express = require("express");
const protect = require("../middlewares/auth.middleware");
const reportController = require("../controllers/report.controller");

const router = express.Router();

router.use(protect);
router.post("/reviews", reportController.createReviewReport);

module.exports = router;
