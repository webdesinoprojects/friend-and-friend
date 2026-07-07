const { addBooking } = require("../utils/bookingStore");

const createBooking = (req, res) => {
  const booking = addBooking(req.body || {});
  return res.status(201).json({ success: true, data: booking });
};

module.exports = { createBooking };
