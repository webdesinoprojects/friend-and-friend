const express = require("express");
const multer = require("multer");
const adminController = require("../controllers/admin.controller");
const reportController = require("../controllers/report.controller");
const adminOnly = require("../middlewares/admin.middleware");
const { ALLOWED_MIME_TYPES, MAX_IMAGE_BYTES } = require("../utils/imagekit");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_BYTES, files: 1 },
  fileFilter(req, file, callback) {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return callback(new Error("Only JPG, PNG and WebP images are allowed."));
    }
    return callback(null, true);
  },
});

function handleUpload(req, res, next) {
  upload.single("image")(req, res, (error) => {
    if (!error) return next();
    return res.status(400).json({ success: false, message: error.message || "Upload failed." });
  });
}

router.post("/login", adminController.loginAdmin);
router.get("/summary", adminOnly, adminController.getAdminSummary);
router.get("/content", adminController.getAdminContent);
router.put("/content", adminOnly, adminController.updateAdminContent);
router.post("/upload", adminOnly, handleUpload, adminController.uploadAdminImage);
router.get("/users", adminOnly, adminController.getAdminUsers);
router.get("/users/:id", adminOnly, adminController.getAdminUserById);
router.get("/providers", adminOnly, adminController.getAdminProviders);
router.post("/users/:id/block", adminOnly, adminController.blockUser);
router.post("/users/:id/unblock", adminOnly, adminController.unblockUser);
router.post("/providers/:id/block", adminOnly, adminController.blockUser);
router.post("/providers/:id/unblock", adminOnly, adminController.unblockUser);
router.get("/bookings", adminOnly, adminController.getAdminBookings);
router.get("/logins", adminOnly, adminController.getAdminLogins);
router.get("/notifications", adminOnly, adminController.getAdminNotifications);
router.get("/payments", adminOnly, adminController.getAdminPayments);
router.get("/reports", adminOnly, reportController.listReports);
router.patch("/reports/:id", adminOnly, reportController.updateReportAction);
router.delete("/reports/:id", adminOnly, reportController.deleteReport);

module.exports = router;
