const express = require("express");
const protect = require("../middlewares/auth.middleware");
const bookingController = require("../controllers/booking.controller");

const router = express.Router();

router.use(protect);

router.get("/", bookingController.listMyBookings);
router.post("/razorpay/order", bookingController.createRazorpayOrder);
router.post("/razorpay/verify", bookingController.verifyRazorpayPayment);
router.post("/", bookingController.createBooking);
router.post("/:id/cancel", bookingController.cancelBooking);
router.post("/:id/complete", bookingController.endMeeting);

router.get("/:id/start-pin", bookingController.revealStartPin);
router.post("/:id/start", bookingController.startMeetingWithPin);
router.get("/:id/end-code", bookingController.getProviderEndOtp);
router.post("/:id/end-code/verify", bookingController.verifyMeetingEndOtp);
router.post("/:id/end", bookingController.endMeeting);
router.post("/:id/extensions/razorpay/order", bookingController.createExtensionOrder);
router.post("/:id/extensions/razorpay/verify", bookingController.verifyExtensionPayment);

// Backwards-compatible route names now use the secured lifecycle.
router.post("/:id/start-otp", bookingController.revealStartPin);
router.post("/:id/verify-start-otp", bookingController.startMeetingWithPin);
router.post("/:id/end-otp", bookingController.getProviderEndOtp);
router.post("/:id/verify-end-otp", bookingController.verifyMeetingEndOtp);

module.exports = router;
