const express = require("express");
const multer = require("multer");

const {
  sendMobileOtp,
  verifyMobileOtp,
  sendEmailOtp,
  verifyEmailOtp,
  sendAadhaarOtp,
  verifyAadhaarOtp,
  sendLoginMobileOtp,
  loginWithMobileOtp,
  register,
  login,
  googleLogin,
  googleRegisterProfile,
  uploadProfileImage,
  uploadKycDocument,
  me,
  updateMe,
  logout,
  getApplication,
  updateApplication,
} = require("../controllers/auth.controller");

const protect = require("../middlewares/auth.middleware");
const accountController = require("../controllers/account.controller");
const { ALLOWED_MIME_TYPES, MAX_IMAGE_BYTES, ALLOWED_KYC_MIME_TYPES, MAX_KYC_DOCUMENT_BYTES } = require("../utils/imagekit");

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

const kycUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_KYC_DOCUMENT_BYTES, files: 1 },
  fileFilter(req, file, callback) {
    if (!ALLOWED_KYC_MIME_TYPES.has(file.mimetype)) return callback(new Error("Only JPG, PNG, WebP or PDF identity documents are allowed."));
    return callback(null, true);
  },
});

function handleKycDocumentUpload(req, res, next) {
  kycUpload.single("document")(req, res, (error) => {
    if (!error) return next();
    return res.status(400).json({ success: false, message: error.message || "Identity document upload failed." });
  });
}

router.post("/send-mobile-otp", sendMobileOtp);
router.post("/verify-mobile-otp", verifyMobileOtp);

router.post("/send-email-otp", sendEmailOtp);
router.post("/verify-email-otp", verifyEmailOtp);
router.post("/send-aadhaar-otp", sendAadhaarOtp);
router.post("/verify-aadhaar-otp", verifyAadhaarOtp);
router.post("/upload-profile-image", handleProfileImageUpload, uploadProfileImage);
router.post("/upload-kyc-document", handleKycDocumentUpload, uploadKycDocument);

router.post("/register", register);

// old password login, keep only if needed
router.post("/login", login);
router.post("/google", googleLogin);
router.post("/google/register-profile", googleRegisterProfile);

// new OTP login
router.post("/send-login-mobile-otp", sendLoginMobileOtp);
router.post("/login-mobile-otp", loginWithMobileOtp);
router.get("/application", getApplication);
router.patch("/application", updateApplication);

router.get("/me", protect.allowDisabled, me);
router.patch("/me", protect, updateMe);
router.post("/logout", protect, logout);
router.get("/account/status", protect.allowDisabled, accountController.getStatus);
router.post("/account/disable", protect.allowDisabled, accountController.disableFor24Hours);
router.post("/account/reactivate", protect.allowDisabled, accountController.reactivate);
router.delete("/account", protect.allowDisabled, accountController.deletePermanently);

module.exports = router;
