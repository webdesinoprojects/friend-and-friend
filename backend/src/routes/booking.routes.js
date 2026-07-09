const express = require("express");
const protect = require("../middlewares/auth.middleware");
const bookingController = require("../controllers/booking.controller");

const router = express.Router();

router.use(protect);

router.get("/", bookingController.listMyBookings);
router.post("/", bookingController.createBooking);
router.post("/:id/cancel", bookingController.cancelBooking);

module.exports = router;
