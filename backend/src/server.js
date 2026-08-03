const express = require("express");
const http = require("http");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const authRoutes = require("./routes/auth.routes");
const providerRoutes = require("./routes/provider.routes");
const adminRoutes = require("./routes/admin.routes");
const contactRoutes = require("./routes/contact.routes");
const bookingRoutes = require("./routes/booking.routes");
const chatRoutes = require("./routes/chat.routes");
const reportRoutes = require("./routes/report.routes");
const notificationRoutes = require("./routes/notification.routes");
const watchlistRoutes = require("./routes/watchlist.routes");
const initializeChatSocket = require("./utils/chatSocket");
const createRateLimit = require("./middlewares/rateLimit.middleware");
const csrfProtection = require("./middlewares/csrf.middleware");
const { maintenanceStatus, enforceMaintenance } = require("./middlewares/maintenance.middleware");

const app = express();
app.set("trust proxy", 1);
const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:5173",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5175",
  "http://127.0.0.1:5175",
];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    exposedHeaders: ["X-CSRF-Token"],
  })
);

app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));
app.use(cookieParser());
app.use(csrfProtection);
app.use("/api", createRateLimit({ max: 300, keyPrefix: "api" }));
app.use("/api/auth", createRateLimit({ max: 60, keyPrefix: "auth" }));
app.use("/api/contact", createRateLimit({ max: 10, keyPrefix: "contact" }));
app.use("/api", (req, res, next) => {
  res.set("Cache-Control", "private, no-store");
  next();
});

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "PPlusOne backend is running.",
  });
});

// This endpoint and every admin route remain available so administrators can
// inspect and disable maintenance mode at any time.
app.get("/api/system/maintenance", maintenanceStatus);
app.use("/api/admin", adminRoutes);
app.use("/api", enforceMaintenance);

app.use("/api/auth", authRoutes);
app.use("/api/providers", providerRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/watchlist", watchlistRoutes);

app.use("/api", (req, res) => {
  res.status(404).json({
    success: false,
    message: `API route not found: ${req.method} ${req.originalUrl}`,
  });
});

const PORT = process.env.PORT || 5000;

if (process.env.VERCEL !== "1") {
  const server = http.createServer(app);
  initializeChatSocket(server, allowedOrigins);
  server.listen(PORT, () => {
    console.log(`PPlusOne backend running on port ${PORT}`);
  });
}

module.exports = app;
