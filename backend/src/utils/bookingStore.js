const fs = require("fs");
const path = require("path");

const bookingPath = path.join(__dirname, "../../data/bookings.json");

function readBookings() {
  try {
    const rows = JSON.parse(fs.readFileSync(bookingPath, "utf8"));
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}

function writeBookings(rows) {
  fs.mkdirSync(path.dirname(bookingPath), { recursive: true });
  fs.writeFileSync(bookingPath, JSON.stringify(rows, null, 2));
}

function addBooking(row) {
  const createdAt = row.createdAt || new Date().toISOString();
  const booking = {
    id: row.id || `BBK-${Date.now()}`,
    userId: row.userId || null,
    userName: row.userName || "User",
    providerId: row.providerId || null,
    providerName: row.providerName || "Provider",
    activity: row.activity || row.service || "Public meetup",
    service: row.service || row.activity || "Public meetup",
    amount: Number(row.amount || 0),
    date: row.date || null,
    time: row.time || null,
    duration: row.duration || null,
    paymentMethod: row.paymentMethod || null,
    paymentStatus: row.paymentStatus || "PAID",
    status: row.status || "CONFIRMED",
    createdAt,
  };
  const next = [booking, ...readBookings().filter((item) => item.id !== booking.id)];
  writeBookings(next);
  return booking;
}

module.exports = { readBookings, addBooking };
