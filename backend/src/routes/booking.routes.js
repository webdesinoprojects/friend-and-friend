const express = require("express");
const protect = require("../middlewares/auth.middleware");
const bookingController = require("../controllers/booking.controller");

const router = express.Router();

router.use(protect);

router.get("/", bookingController.listMyBookings);
router.post("/", bookingController.createBooking);
router.post("/:id/cancel", bookingController.cancelBooking);

// OTP routes for booking verification
router.post("/:id/start-otp", bookingController.generateStartOtp);
router.post("/:id/verify-start-otp", bookingController.validateStartOtp);
router.post("/:id/end-otp", bookingController.generateEndOtp);
router.post("/:id/verify-end-otp", bookingController.validateEndOtp);

module.exports = router;
