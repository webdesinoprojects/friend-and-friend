const express = require("express");
const multer = require("multer");

const {
  sendMobileOtp,
  verifyMobileOtp,
  sendEmailOtp,
  verifyEmailOtp,
  sendLoginMobileOtp,
  loginWithMobileOtp,
  register,
  login,
  googleLogin,
  googleRegisterProfile,
  uploadProfileImage,
  me,
  logout,
} = require("../controllers/auth.controller");

const protect = require("../middlewares/auth.middleware");
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

function handleProfileImageUpload(req, res, next) {
  upload.single("image")(req, res, (error) => {
    if (!error) return next();
    return res.status(400).json({
      success: false,
      message: error.message || "Profile photo upload failed.",
    });
  });
}

router.post("/send-mobile-otp", sendMobileOtp);
router.post("/verify-mobile-otp", verifyMobileOtp);

router.post("/send-email-otp", sendEmailOtp);
router.post("/verify-email-otp", verifyEmailOtp);
router.post("/upload-profile-image", handleProfileImageUpload, uploadProfileImage);

router.post("/register", register);

// old password login, keep only if needed
router.post("/login", login);
router.post("/google", googleLogin);
router.post("/google/register-profile", googleRegisterProfile);

// new OTP login
router.post("/send-login-mobile-otp", sendLoginMobileOtp);
router.post("/login-mobile-otp", loginWithMobileOtp);

router.get("/me", protect, me);
router.post("/logout", protect, logout);

module.exports = router;
