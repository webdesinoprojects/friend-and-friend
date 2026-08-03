const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const prisma = require("../config/prisma");
const { normalizeStoredImage, uploadProviderImage, uploadKycDocument: storeKycDocument } = require("../utils/imagekit");
const { publicAccountState } = require("../utils/accountLifecycle");
const generateOtp = require("../utils/generateOtp");
const { sendApplicationReceived } = require("../utils/email");
const { sendMobileOtp: deliverMobileOtp, sendEmailOtp: deliverEmailOtp } = require("../utils/otpDelivery");
const {
  issueUserSession,
  issueApplicationSession,
  clearSessions,
  sessionToken,
} = require("../utils/sessionCookies");

function applicationBlockedResponse(res, user) {
  issueApplicationSession(res, user);
  return res.status(403).json({
    success: false,
    applicationPending: user.kycStatus === "PENDING",
    applicationRejected: user.kycStatus === "REJECTED",
    status: user.kycStatus,
    reason: user.rejectionReason || user.kycVerification?.rejectionReason || null,
    message: user.kycStatus === "REJECTED"
      ? "Your application was rejected. Review the reason and update your registration details."
      : "Your application is being reviewed by the admin. We will email you after a decision.",
  });
}

function publicApplication(application) {
  return {
    id: application.id, fullName: application.fullName, email: application.email, phone: application.phone,
    dob: application.dob, gender: application.gender, city: application.city, state: application.state,
    role: application.role, mobileVerified: application.mobileVerified, emailVerified: application.emailVerified,
    profileImage: application.profileImage, referenceSelfie: application.referenceSelfie,
    kycStatus: application.status, faceStatus: application.status, rejectionReason: application.rejectionReason,
    createdAt: application.createdAt, updatedAt: application.updatedAt,
    userProfile: application.userProfile, providerProfile: application.providerProfile,
    kycVerification: {
      documentType: application.documentType, documentNumber: application.documentNumber,
      documentNumberLast4: application.documentLast4, documentUrl: application.documentUrl,
      consentAccepted: application.consentAccepted, status: application.status,
      rejectionReason: application.rejectionReason, createdAt: application.createdAt,
    },
  };
}

async function calculateUserRating(userId, role) {
  const reviews = await prisma.reviewReport.findMany({
    where: {
      reason: '__PPlusOne_REVIEW__',
      adminAction: null,
      targetRole: role,
      reportedUserId: userId,
      rating: { not: null },
    },
    select: { rating: true },
  });

  if (!reviews.length) return null;

  const sum = reviews.reduce((acc, review) => acc + Number(review.rating || 0), 0);
  return Number((sum / reviews.length).toFixed(2));
}

function addMinutes(minutes) {
  return new Date(Date.now() + minutes * 60 * 1000);
}

function environmentFlag(name, fallback) {
  const value = process.env[name];
  if (value === undefined || value === "") return fallback;
  return String(value).toLowerCase() !== "false";
}

function isMobileOtpDemoMode() {
  return environmentFlag("MOBILE_OTP_TEST_MODE", true);
}

function isEmailOtpDemoMode() {
  return environmentFlag("EMAIL_OTP_TEST_MODE", environmentFlag("OTP_TEST_MODE", true));
}

function normalizeProviderImages(images) {
  if (!Array.isArray(images)) return [];
  return images.map(normalizeStoredImage).filter(Boolean);
}

function normalizeProfileImage(image) {
  const normalized = normalizeStoredImage(image);
  return normalized?.url || null;
}

async function registrationIdentityExists({ phone, email }) {
  const normalizedEmail = email ? String(email).trim().toLowerCase() : "";
  const identities = [
    phone ? { phone } : null,
    normalizedEmail ? { email: normalizedEmail } : null,
  ].filter(Boolean);
  const [user, application] = await Promise.all([
    prisma.user.findFirst({ where: { OR: identities }, select: { id: true } }),
    prisma.registrationApplication.findFirst({ where: { OR: identities }, select: { id: true } }),
  ]);
  return Boolean(user || application);
}

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function getPublicUser(user) {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    profileImage: user.profileImage,
    role: user.role,
    city: user.city,
    state: user.state,
    gender: user.gender,
    mobileVerified: user.mobileVerified,
    emailVerified: user.emailVerified,
    kycStatus: user.kycStatus,
    faceStatus: user.faceStatus,
    userProfile: user.userProfile,
    providerProfile: user.providerProfile,
    ...publicAccountState(user),
  };
}

async function verifyGoogleCredential(credential) {
  if (!process.env.GOOGLE_CLIENT_ID) {
    throw new Error("Google login is not configured.");
  }

  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();

  if (!payload?.email || !payload.email_verified) {
    throw new Error("Google email is not verified.");
  }

  return {
    email: payload.email.toLowerCase(),
    fullName: payload.name || payload.email.split("@")[0],
    picture: payload.picture || null,
  };
}

exports.sendMobileOtp = async (req, res) => {
  try {
    const phone = String(req.body?.phone || "").replace(/\D/g, "");

    if (!/^\d{10}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid 10-digit mobile number.",
      });
    }
    if (await registrationIdentityExists({ phone })) {
      return res.status(409).json({ success: false, message: "This mobile number is already registered." });
    }

    const otp = generateOtp();

    const otpRecord = await prisma.otpToken.create({
      data: {
        phone,
        otp,
        type: "MOBILE",
        expiresAt: addMinutes(10),
      },
    });
    const testMode = isMobileOtpDemoMode();
    if (!testMode) {
      try {
        await deliverMobileOtp(phone, otp);
      } catch (error) {
        await prisma.otpToken.delete({ where: { id: otpRecord.id } }).catch(() => {});
        throw error;
      }
    }

    return res.json({
      success: true,
      message: testMode ? "Demo mobile OTP generated successfully." : "Mobile OTP sent successfully.",
      ...(testMode ? { demoOtp: otp } : {}),
    });
  } catch (error) {
    console.error("SEND_MOBILE_OTP_ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send mobile OTP.",
    });
  }
};

exports.verifyMobileOtp = async (req, res) => {
  try {
    const phone = String(req.body?.phone || "").replace(/\D/g, "");
    const otp = String(req.body?.otp || "").trim();

    if (!/^\d{10}$/.test(phone) || !otp) {
      return res.status(400).json({
        success: false,
        message: "Phone and OTP are required.",
      });
    }
    if (await registrationIdentityExists({ phone })) {
      return res.status(409).json({ success: false, message: "This mobile number is already registered." });
    }

    const otpRecord = await prisma.otpToken.findFirst({
      where: {
        phone,
        otp,
        type: "MOBILE",
        verified: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired mobile OTP.",
      });
    }

    await prisma.otpToken.update({
      where: { id: otpRecord.id },
      data: { verified: true },
    });

    await prisma.user.updateMany({
      where: { phone },
      data: { mobileVerified: true },
    });

    return res.json({
      success: true,
      message: "Mobile verified successfully.",
    });
  } catch (error) {
    console.error("VERIFY_MOBILE_OTP_ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Mobile OTP verification failed.",
    });
  }
};

exports.sendEmailOtp = async (req, res) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }
    if (await registrationIdentityExists({ email })) {
      return res.status(409).json({ success: false, message: "This email address is already registered." });
    }

    const otp = generateOtp();

    const otpRecord = await prisma.otpToken.create({
      data: {
        email,
        otp,
        type: "EMAIL",
        expiresAt: addMinutes(10),
      },
    });
    const testMode = isEmailOtpDemoMode();
    if (!testMode) {
      try {
        await deliverEmailOtp(email, otp);
      } catch (error) {
        console.error("EMAIL_OTP_DELIVERY_ERROR:", error.message);
        await prisma.otpToken.delete({ where: { id: otpRecord.id } }).catch(() => {});
        return res.status(502).json({
          success: false,
          message: "Email delivery is temporarily unavailable. Please try again later.",
        });
      }
    }

    return res.json({
      success: true,
      message: testMode ? "Demo email OTP generated successfully." : "Email OTP sent successfully.",
      ...(testMode ? { demoOtp: otp } : {}),
    });
  } catch (error) {
    console.error("SEND_EMAIL_OTP_ERROR:", error);
    return res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === "production" ? "Failed to send email OTP." : error.message || "Failed to send email OTP.",
    });
  }
};

exports.verifyEmailOtp = async (req, res) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const otp = String(req.body?.otp || "").trim();

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required.",
      });
    }
    if (await registrationIdentityExists({ email })) {
      return res.status(409).json({ success: false, message: "This email address is already registered." });
    }

    const otpRecord = await prisma.otpToken.findFirst({
      where: {
        email,
        otp,
        type: "EMAIL",
        verified: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired email OTP.",
      });
    }

    await prisma.otpToken.update({
      where: { id: otpRecord.id },
      data: { verified: true },
    });

    await prisma.user.updateMany({
      where: { email },
      data: { emailVerified: true },
    });

    return res.json({
      success: true,
      message: "Email verified successfully.",
    });
  } catch (error) {
    console.error("VERIFY_EMAIL_OTP_ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Email OTP verification failed.",
    });
  }
};

exports.uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Profile photo is required.",
      });
    }

    const image = await uploadProviderImage(req.file, 0);

    return res.json({
      success: true,
      image,
    });
  } catch (error) {
    console.error("UPLOAD_PROFILE_IMAGE_ERROR:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Profile photo upload failed.",
    });
  }
};

exports.sendAadhaarOtp = async (req, res) => {
  try {
    const aadhaar = String(req.body?.aadhaar || "").replace(/\D/g, "");
    if (!/^\d{12}$/.test(aadhaar)) return res.status(400).json({ success: false, message: "Enter a valid 12-digit Aadhaar number." });
    const otp = generateOtp();
    await prisma.otpToken.create({ data: { email: `aadhaar:${aadhaar}`, otp, type: "AADHAAR_DEMO", expiresAt: addMinutes(10) } });
    return res.json({ success: true, message: "Demo Aadhaar OTP generated successfully.", demoOtp: otp });
  } catch (error) {
    console.error("SEND_AADHAAR_OTP_ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to generate Aadhaar demo OTP." });
  }
};

exports.verifyAadhaarOtp = async (req, res) => {
  try {
    const aadhaar = String(req.body?.aadhaar || "").replace(/\D/g, "");
    const otp = String(req.body?.otp || "").trim();
    if (!/^\d{12}$/.test(aadhaar) || !otp) return res.status(400).json({ success: false, message: "Aadhaar number and OTP are required." });
    const record = await prisma.otpToken.findFirst({ where: { email: `aadhaar:${aadhaar}`, otp, type: "AADHAAR_DEMO", verified: false, expiresAt: { gt: new Date() } }, orderBy: { createdAt: "desc" } });
    if (!record) return res.status(400).json({ success: false, message: "Invalid or expired Aadhaar demo OTP." });
    await prisma.otpToken.update({ where: { id: record.id }, data: { verified: true } });
    return res.json({ success: true, message: "Aadhaar demo verification completed." });
  } catch (error) {
    console.error("VERIFY_AADHAAR_OTP_ERROR:", error);
    return res.status(500).json({ success: false, message: "Aadhaar demo OTP verification failed." });
  }
};

exports.uploadKycDocument = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "Identity document is required." });
    const document = await storeKycDocument(req.file);
    return res.json({ success: true, document });
  } catch (error) {
    console.error("UPLOAD_KYC_DOCUMENT_ERROR:", error);
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Identity document upload failed." });
  }
};

const register = async (req, res) => {
  try {
    const {
      fullName,
      email,
      phone,
      password,
      dob,
      gender,
      city,
      state,
      role,

      aadhaarLast4,
      documentType,
      documentNumber,
      documentNumberLast4,
      documentUrl,
      kycConsent,
      referenceSelfie,
      profileImage,
      ageConfirmed,
      safetyAccepted,

      userProfile,
      providerProfile,
      googleCredential,
    } = req.body;

    if (!fullName || !email || !phone || !city || !state || !gender || !role) {
      return res.status(400).json({
        success: false,
        message: "Full name, email, phone, city, state, gender and role are required.",
      });
    }

    if (!["USER", "PROVIDER"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role selected.",
      });
    }
    if (!ageConfirmed || !safetyAccepted) {
      return res.status(400).json({ success: false, message: "You must confirm that you are 18+ and accept the Safety page." });
    }

    if (!/^\d{10}$/.test(String(phone))) {
      return res.status(400).json({ success: false, message: "Mobile number must contain exactly 10 digits." });
    }

    if (!/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(String(password || ""))) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters and include one capital letter, one number and one special character.",
      });
    }

    const existingPhone = await prisma.user.findUnique({
      where: { phone },
    });

    const existingPhoneApplication = await prisma.registrationApplication.findUnique({ where: { phone } });

    if (existingPhone || existingPhoneApplication) {
      return res.status(409).json({
        success: false,
        message: "Phone number already registered.",
      });
    }

    if (email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email },
      });

      const existingEmailApplication = await prisma.registrationApplication.findUnique({ where: { email } });

      if (existingEmail || existingEmailApplication) {
        return res.status(409).json({
          success: false,
          message: "Email already registered.",
        });
      }
    }

    const mobileOtpVerified = await prisma.otpToken.findFirst({
      where: {
        phone,
        type: "MOBILE",
        verified: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!mobileOtpVerified) {
      return res.status(400).json({
        success: false,
        message: "Mobile verification is required before registration.",
      });
    }

    let emailOtpVerified = null;
    let googleProfile = null;

    if (email) {
      if (googleCredential) {
        googleProfile = await verifyGoogleCredential(googleCredential);

        if (googleProfile.email !== email.toLowerCase()) {
          return res.status(400).json({
            success: false,
            message: "Google email does not match registration email.",
          });
        }
      } else {
        emailOtpVerified = await prisma.otpToken.findFirst({
          where: {
            email,
            type: "EMAIL",
            verified: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        });
      }

      if (!emailOtpVerified && !googleProfile) {
        return res.status(400).json({
          success: false,
          message: "Please verify email OTP or remove email.",
        });
      }
    }

    const fullDocumentNumber = documentNumber ? String(documentNumber).trim() : "";
    const resolvedDocumentLast4 =
      documentNumberLast4 || (fullDocumentNumber ? fullDocumentNumber.slice(-4) : null);

    if (!documentType || (!fullDocumentNumber && !resolvedDocumentLast4) || !documentUrl || !kycConsent) {
      return res.status(400).json({
        success: false,
        message: "KYC document type, number, uploaded identity proof and consent are required.",
      });
    }

    if (!referenceSelfie) {
      return res.status(400).json({
        success: false,
        message: "Live selfie is required.",
      });
    }

    if (!normalizeProfileImage(profileImage)) {
      return res.status(400).json({
        success: false,
        message: "Profile photo is required.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const application = await prisma.registrationApplication.create({
      data: {
        fullName, email, phone, passwordHash, dob: dob || null, gender, city, state, role,
        mobileVerified: true, emailVerified: Boolean(emailOtpVerified || googleProfile),
        profileImage: normalizeProfileImage(profileImage), referenceSelfie,
        documentType, documentNumber: fullDocumentNumber,
        documentLast4: resolvedDocumentLast4 || null, documentUrl,
        consentAccepted: Boolean(kycConsent),
        ageConfirmed: Boolean(ageConfirmed),
        safetyAccepted: Boolean(safetyAccepted),
        userProfile: role === "USER" ? (userProfile || {}) : undefined,
        providerProfile: role === "PROVIDER" ? (providerProfile || {}) : undefined,
        status: "PENDING",
      },
    });

    sendApplicationReceived(application).catch((error) => console.error("APPLICATION_EMAIL_ERROR:", error.message));
    issueApplicationSession(res, application);

    return res.status(201).json({
      success: true,
      message: "Registration successful. Your application is now under admin review.",
      user: publicApplication(application),
    });
  } catch (error) {
    console.error("REGISTER_ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Registration failed.",
      error: error.message,
    });
  }
};

exports.login = async (req, res) => {
  try {
const { email, phone, password } = req.body;
const identifier = email || phone;

if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: "Email or phone and password are required.",
      });
    }

const user = await prisma.user.findUnique({
  where: email ? { email } : { phone },
  select: {
    id: true,
    fullName: true,
    email: true,
    phone: true,
    profileImage: true,
    passwordHash: true,
    role: true,
    city: true,
    state: true,
    gender: true,
    mobileVerified: true,
    emailVerified: true,
    kycStatus: true,
    faceStatus: true,
    isBlocked: true,
    disabledAt: true,
    disabledUntil: true,
    userProfile: true,
    providerProfile: true,
    createdAt: true,
  },
});

    if (!user) {
      const application = await prisma.registrationApplication.findFirst({ where: email ? { email } : { phone } });
      if (application && await bcrypt.compare(password, application.passwordHash)) {
        return applicationBlockedResponse(res, { ...application, kycStatus: application.status });
      }
      await prisma.loginAttempt.create({
        data: {
          email: email || null,
          success: false,
          faceMatched: false,
          message: "User not found.",
        },
      });

      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    if (user.isBlocked) {
      await prisma.loginAttempt.create({
        data: {
          userId: user.id,
          email: user.email || email || null,
          success: false,
          faceMatched: false,
          message: "Blocked user attempted login.",
        },
      });

      return res.status(403).json({
        success: false,
        message: "You have been blocked by the admin now you are not allowed to use this website again",
      });
    }

if (!user.passwordHash) {
  await prisma.loginAttempt.create({
    data: {
      userId: user.id,
      email: user.email || email || null,
      success: false,
      faceMatched: false,
      message: "Password login disabled for this account.",
    },
  });

  return res.status(401).json({
    success: false,
    message: "Password login is not available. Please use mobile OTP login.",
  });
}

const passwordMatched = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatched) {
      await prisma.loginAttempt.create({
        data: {
          userId: user.id,
          email: user.email || email || null,
          success: false,
          faceMatched: false,
          message: "Wrong password.",
        },
      });

      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    if (user.kycStatus !== "VERIFIED") {
      const applicationUser = await prisma.user.findUnique({ where: { id: user.id }, include: { kycVerification: true } });
      return applicationBlockedResponse(res, applicationUser);
    }

    issueUserSession(res, user, { remember: Boolean(req.body?.rememberMe) });

    await prisma.loginAttempt.create({
      data: {
        userId: user.id,
        email: user.email || email || null,
        success: true,
        faceMatched: false,
        message: "Login successful.",
      },
    });

    const averageRating = await calculateUserRating(user.id, user.role);

    return res.json({
      success: true,
      message: "Login successful.",
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        profileImage: user.profileImage,
        role: user.role,
        city: user.city,
        state: user.state,
        mobileVerified: user.mobileVerified,
        emailVerified: user.emailVerified,
        kycStatus: user.kycStatus,
        faceStatus: user.faceStatus,
        userProfile: user.userProfile,
        providerProfile: user.providerProfile,
        averageRating,
        ...publicAccountState(user),
      },
    });
  } catch (error) {
    console.error("LOGIN_ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Login failed.",
    });
  }
};

exports.googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        success: false,
        message: "Google credential is required.",
      });
    }

    const googleUser = await verifyGoogleCredential(credential);

    const user = await prisma.user.findUnique({
      where: { email: googleUser.email },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        profileImage: true,
        role: true,
        city: true,
        state: true,
        gender: true,
        mobileVerified: true,
        emailVerified: true,
        kycStatus: true,
        faceStatus: true,
        userProfile: true,
        providerProfile: true,
        createdAt: true,
        isBlocked: true,
        disabledAt: true,
        disabledUntil: true,
      },
    });

    if (!user) {
      const application = await prisma.registrationApplication.findUnique({ where: { email: googleUser.email } });
      if (application) return applicationBlockedResponse(res, { ...application, kycStatus: application.status });
      return res.status(404).json({
        success: false,
        needsRegistration: true,
        message: "No PPlusOne account found. Complete registration first.",
        profile: googleUser,
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: "You have been blocked by the admin now you are not allowed to use this website again",
      });
    }

    if (user.kycStatus !== "VERIFIED") {
      const applicationUser = await prisma.user.findUnique({ where: { id: user.id }, include: { kycVerification: true } });
      return applicationBlockedResponse(res, applicationUser);
    }

    if (!user.emailVerified) {
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true },
      });
      user.emailVerified = true;
    }

    await prisma.loginAttempt.create({
      data: {
        userId: user.id,
        email: user.email,
        success: true,
        faceMatched: false,
        message: "Google login successful.",
      },
    });

    issueUserSession(res, user, { remember: Boolean(req.body?.rememberMe) });
    return res.json({
      success: true,
      message: "Google login successful.",
      user: getPublicUser(user),
    });
  } catch (error) {
    console.error("GOOGLE_LOGIN_ERROR:", error);
    return res.status(401).json({
      success: false,
      message: error.message || "Google login failed.",
    });
  }
};

exports.googleRegisterProfile = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        success: false,
        message: "Google credential is required.",
      });
    }

    const googleUser = await verifyGoogleCredential(credential);

    return res.json({
      success: true,
      message: "Google email verified.",
      profile: googleUser,
    });
  } catch (error) {
    console.error("GOOGLE_REGISTER_PROFILE_ERROR:", error);
    return res.status(401).json({
      success: false,
      message: error.message || "Google verification failed.",
    });
  }
};

exports.me = async (req, res) => {
  const rating = await calculateUserRating(req.user.id, req.user.role);
  return res.json({
    success: true,
    user: { ...req.user, ...publicAccountState(req.user), averageRating: rating },
  });
};

exports.updateMe = async (req, res) => {
  try {
    const clean = (value) => (value === undefined || value === null ? undefined : String(value).trim());
    const userData = {};
    ["fullName", "email", "city", "state", "gender", "profileImage"].forEach((field) => {
      const value = clean(req.body?.[field]);
      if (value !== undefined) userData[field] = value || null;
    });

    const profileData = {};
    ["bio", "interests", "preferredActivities", "activityPreferences", "preferredLanguage", "emergencyContact"].forEach((field) => {
      const value = clean(req.body?.userProfile?.[field] ?? req.body?.[field]);
      if (value !== undefined) profileData[field] = value || null;
    });

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...userData,
        userProfile: Object.keys(profileData).length
          ? {
              upsert: {
                create: profileData,
                update: profileData,
              },
            }
          : undefined,
      },
      include: { userProfile: true, providerProfile: true },
    });

    return res.json({ success: true, user: getPublicUser(updated) });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Profile update failed.",
      error: error.message,
    });
  }
};

exports.logout = async (req, res) => {
  clearSessions(res);
  return res.json({
    success: true,
    message: "Logout successful.",
  });
};


const loginWithMobileOtp = async (req, res) => {
  try {
    const { phone, otp, loginSelfie } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        message: "Phone and OTP are required.",
      });
    }

    const otpRecord = await prisma.otpToken.findFirst({
      where: {
        phone,
        otp,
        type: "LOGIN_MOBILE",
        verified: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP.",
      });
    }

    const user = await prisma.user.findUnique({
      where: { phone },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        city: true,
        state: true,
        gender: true,
        mobileVerified: true,
        emailVerified: true,
        kycStatus: true,
        faceStatus: true,
        referenceSelfie: true,
        isBlocked: true,
        disabledAt: true,
        disabledUntil: true,
        userProfile: true,
        providerProfile: true,
      },
    });

    if (!user) {
      const application = await prisma.registrationApplication.findUnique({ where: { phone } });
      if (application) return applicationBlockedResponse(res, { ...application, kycStatus: application.status });
      return res.status(404).json({
        success: false,
        message: "No account found with this phone number.",
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: "You have been blocked by the admin now you are not allowed to use this website again",
      });
    }

    if (user.kycStatus !== "VERIFIED") return applicationBlockedResponse(res, user);

    await prisma.otpToken.update({
      where: { id: otpRecord.id },
      data: { verified: true },
    });

    const faceMatched = Boolean(user.referenceSelfie && loginSelfie);

    await prisma.loginAttempt.create({
      data: {
        userId: user.id,
        email: user.email || null,
        success: true,
        faceMatched,
        message: "Mobile OTP login successful.",
      },
    });

    issueUserSession(res, user, { remember: Boolean(req.body?.rememberMe) });

    const { referenceSelfie, ...safeUser } = user;

    const averageRating = await calculateUserRating(user.id, user.role);

    return res.status(200).json({
      success: true,
      message: "Mobile OTP login successful.",
      user: { ...safeUser, ...publicAccountState(user), averageRating },
    });
  } catch (error) {
    console.error("LOGIN_MOBILE_OTP_ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Mobile OTP login failed.",
      error: error.message,
    });
  }
};

exports.getApplication = async (req, res) => {
  try {
    const token = sessionToken(req, "application");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.purpose !== "application-review") throw new Error("Wrong token purpose");
    const application = await prisma.registrationApplication.findUnique({ where: { id: decoded.id } });
    if (!application) return res.status(404).json({ success: false, message: "Application not found." });
    return res.json({ success: true, data: publicApplication(application) });
  } catch {
    return res.status(401).json({ success: false, message: "Application access expired. Sign in again to view it." });
  }
};

exports.updateApplication = async (req, res) => {
  try {
    const token = sessionToken(req, "application");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.purpose !== "application-review") throw new Error("Wrong token purpose");
    const current = await prisma.registrationApplication.findUnique({ where: { id: decoded.id } });
    if (!current) return res.status(404).json({ success: false, message: "Application not found." });

    const body = req.body || {};
    if (body.phone && body.phone !== current.phone) return res.status(400).json({ success: false, message: "Verify a changed mobile number before updating the application." });
    if (body.email && body.email !== current.email) return res.status(400).json({ success: false, message: "Verify a changed email before updating the application." });
    const documentNumber = String(body.documentNumber || current.documentNumber || "").trim();
    const documentType = body.documentType || current.documentType;
    if (documentType === "AADHAAR" && !/^\d{12}$/.test(documentNumber)) return res.status(400).json({ success: false, message: "Aadhaar number must contain exactly 12 digits." });
    const last4 = documentNumber.slice(-4) || current.documentLast4;

    const application = await prisma.registrationApplication.update({
      where: { id: current.id },
      data: {
        fullName: String(body.fullName || current.fullName).trim(),
        city: String(body.city || current.city || "").trim(),
        state: String(body.state || current.state || "").trim(),
        gender: body.gender || current.gender,
        profileImage: body.profileImage ? normalizeProfileImage(body.profileImage) : current.profileImage,
        referenceSelfie: body.referenceSelfie || current.referenceSelfie,
        documentType,
        documentNumber, documentLast4: last4,
        documentUrl: body.documentUrl || current.documentUrl,
        consentAccepted: body.kycConsent !== undefined ? Boolean(body.kycConsent) : current.consentAccepted,
        status: "PENDING", rejectionReason: null, decisionAt: null,
        userProfile: current.role === "USER" && body.userProfile ? body.userProfile : undefined,
        providerProfile: current.role === "PROVIDER" && body.providerProfile ? body.providerProfile : undefined,
      },
    });
    return res.json({ success: true, message: "Application updated and submitted for admin review.", data: publicApplication(application) });
  } catch (error) {
    console.error("UPDATE_APPLICATION_ERROR:", error);
    return res.status(401).json({ success: false, message: "Application could not be updated. Sign in again and retry." });
  }
};

const sendLoginMobileOtp = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required.",
      });
    }

    const user = await prisma.user.findUnique({
      where: { phone },
    });

    const application = !user ? await prisma.registrationApplication.findUnique({ where: { phone } }) : null;
    if (!user && !application) {
      return res.status(404).json({
        success: false,
        message: "No account found with this phone number.",
      });
    }

    const otp = generateOtp();

    await prisma.otpToken.create({
      data: {
        phone,
        otp,
        type: "LOGIN_MOBILE",
        verified: false,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });
    const testMode = isMobileOtpDemoMode();
    if (!testMode) await deliverMobileOtp(phone, otp);

    return res.status(200).json({
      success: true,
      message: testMode ? "Demo login OTP generated successfully." : "Login OTP sent successfully.",
      ...(testMode ? { demoOtp: otp } : {}),
    });
  } catch (error) {
    console.error("SEND_LOGIN_MOBILE_OTP_ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to send login OTP.",
      error: error.message,
    });
  }
};

const resetPasswordWithMobileOtp = async (req, res) => {
  try {
    const phone = String(req.body?.phone || "").replace(/\D/g, "");
    const otp = String(req.body?.otp || "").trim();
    const password = String(req.body?.password || "");
    if (!/^\d{10}$/.test(phone) || !otp) return res.status(400).json({ success: false, message: "Phone number and OTP are required." });
    if (!/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(password)) return res.status(400).json({ success: false, message: "Password must have 8 characters, one capital letter, one number and one special character." });
    const token = await prisma.otpToken.findFirst({ where: { phone, otp, type: "LOGIN_MOBILE", verified: false, expiresAt: { gt: new Date() } }, orderBy: { createdAt: "desc" } });
    if (!token) return res.status(400).json({ success: false, message: "OTP is invalid or expired." });
    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) return res.status(404).json({ success: false, message: "No account found with this phone number." });
    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { passwordHash } }),
      prisma.otpToken.update({ where: { id: token.id }, data: { verified: true } }),
    ]);
    return res.json({ success: true, message: "Password reset successfully. You can now log in." });
  } catch (error) {
    console.error("RESET_PASSWORD_ERROR:", error);
    return res.status(500).json({ success: false, message: "Password could not be reset." });
  }
};

module.exports = {
  sendMobileOtp: exports.sendMobileOtp,
  verifyMobileOtp: exports.verifyMobileOtp,
  sendEmailOtp: exports.sendEmailOtp,
  verifyEmailOtp: exports.verifyEmailOtp,
  sendAadhaarOtp: exports.sendAadhaarOtp,
  verifyAadhaarOtp: exports.verifyAadhaarOtp,

  register,
  login: exports.login,
  googleLogin: exports.googleLogin,
  googleRegisterProfile: exports.googleRegisterProfile,
  uploadProfileImage: exports.uploadProfileImage,
  uploadKycDocument: exports.uploadKycDocument,
  me: exports.me,
  updateMe: exports.updateMe,
  logout: exports.logout,
  getApplication: exports.getApplication,
  updateApplication: exports.updateApplication,

  sendLoginMobileOtp,
  loginWithMobileOtp,
  resetPasswordWithMobileOtp,
};
