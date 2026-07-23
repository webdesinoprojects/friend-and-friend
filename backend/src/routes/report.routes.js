const express = require("express");
const protect = require("../middlewares/auth.middleware");
const reportController = require("../controllers/report.controller");

const router = express.Router();

router.use(protect);
router.get("/reviews", reportController.listMyReviews);
router.post("/reviews", reportController.createReview);
router.post("/reviews/report", reportController.createReviewReport);
router.get("/me", reportController.getMyReportSummary);
router.post("/meetings", reportController.createMeetingReport);

module.exports = router;
