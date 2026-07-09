const bcrypt = require("bcryptjs");
const { OAuth2Client } = require("google-auth-library");
const prisma = require("../config/prisma");
const generateOtp = require("../utils/generateOtp");
const generateToken = require("../utils/generateToken");
const { normalizeStoredImage, uploadProviderImage } = require("../utils/imagekit");

function addMinutes(minutes) {
  return new Date(Date.now() + minutes * 60 * 1000);
}

function normalizeProviderImages(images) {
  if (!Array.isArray(images)) return [];
  return images.map(normalizeStoredImage).filter(Boolean);
}

function normalizeProfileImage(image) {
  const normalized = normalizeStoredImage(image);
  return normalized?.url || null;
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
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required.",
      });
    }

    const otp = generateOtp();

    await prisma.otpToken.create({
      data: {
        phone,
        otp,
        type: "MOBILE",
        expiresAt: addMinutes(10),
      },
    });

    return res.json({
      success: true,
      message: "Mobile OTP sent successfully.",
      demoOtp: otp,
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
    const { phone, otp } = req.body;

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
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    const otp = generateOtp();

    await prisma.otpToken.create({
      data: {
        email,
        otp,
        type: "EMAIL",
        expiresAt: addMinutes(10),
      },
    });

    return res.json({
      success: true,
      message: "Email OTP sent successfully.",
      demoOtp: otp,
    });
  } catch (error) {
    console.error("SEND_EMAIL_OTP_ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send email OTP.",
    });
  }
};

exports.verifyEmailOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required.",
      });
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
      documentNumberLast4,
      kycConsent,
      referenceSelfie,
      profileImage,

      userProfile,
      providerProfile,
      googleCredential,
    } = req.body;

    if (!fullName || !phone || !city || !state || !gender || !role) {
      return res.status(400).json({
        success: false,
        message: "Full name, phone, city, state, gender and role are required.",
      });
    }

    if (!["USER", "PROVIDER"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role selected.",
      });
    }

    if (!password || String(password).length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters.",
      });
    }

    const existingPhone = await prisma.user.findUnique({
      where: { phone },
    });

    if (existingPhone) {
      return res.status(409).json({
        success: false,
        message: "Phone number already registered.",
      });
    }

    if (email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email },
      });

      if (existingEmail) {
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

    if (!documentType || !documentNumberLast4 || !kycConsent) {
      return res.status(400).json({
        success: false,
        message: "KYC document type, document last 4 and consent are required.",
      });
    }

    if (!referenceSelfie) {
      return res.status(400).json({
        success: false,
        message: "Live selfie is required.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        fullName,
        email: email || null,
        phone,
        passwordHash,
        dob: dob || null,
        gender,
        city,
        state,
        role,

        mobileVerified: true,
        emailVerified: Boolean(emailOtpVerified || googleProfile),

        kycStatus: "PENDING",
        faceStatus: "VERIFIED",
        referenceSelfie,
        profileImage: normalizeProfileImage(profileImage),
        aadhaarLast4: aadhaarLast4 || documentNumberLast4 || null,

        kycVerification: {
          create: {
            aadhaarLast4: aadhaarLast4 || documentNumberLast4 || null,
            documentType: documentType || null,
            documentNumberLast4: documentNumberLast4 || null,
            consentAccepted: Boolean(kycConsent),
            status: "PENDING",
          },
        },

userProfile:
  role === "USER"
    ? {
        create: {
          interests: userProfile?.interests || null,
          preferredActivities: userProfile?.preferredActivities || null,
          activityPreferences: userProfile?.activityPreferences || null,
          preferredLanguage: userProfile?.preferredLanguage || null,
          bio: userProfile?.bio || null,
          profileQuestions: userProfile?.profileQuestions || [],
          emergencyContact: userProfile?.emergencyContact || null,
        },
      }
    : undefined,

providerProfile:
  role === "PROVIDER"
    ? {
        create: {
          headline: providerProfile?.headline || providerProfile?.profession || null,
          profession: providerProfile?.profession || null,
          education: providerProfile?.education || null,
          height: providerProfile?.height || null,
          hobbies: providerProfile?.hobbies || null,
          hourlyPrice: providerProfile?.hourlyPrice || null,
          availableCity: providerProfile?.availableCity || null,
          languages: providerProfile?.languages || null,
          availabilityDays: providerProfile?.availabilityDays || null,
          activities: providerProfile?.activities || providerProfile?.hobbies || null,
          bio: providerProfile?.bio || null,
          profileImages: normalizeProviderImages(providerProfile?.profileImages),
          profileQuestions: providerProfile?.profileQuestions || [],
          providerSafetyAgreement: Boolean(
            providerProfile?.providerSafetyAgreement
          ),
          approved: true,
        },
      }
    : undefined,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        profileImage: true,
        role: true,
        city: true,
        state: true,
        mobileVerified: true,
        emailVerified: true,
        kycStatus: true,
        faceStatus: true,
      },
    });

    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      message: "Registration successful.",
      token,
      user,
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
    userProfile: true,
    providerProfile: true,
    createdAt: true,
  },
});

    if (!user) {
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

    const token = generateToken(user);

    await prisma.loginAttempt.create({
      data: {
        userId: user.id,
        email: user.email || email || null,
        success: true,
        faceMatched: false,
        message: "Login successful.",
      },
    });

    return res.json({
      success: true,
      message: "Login successful.",
      token,
      user: {
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
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        needsRegistration: true,
        message: "No BuddyBOOK account found. Complete registration first.",
        profile: googleUser,
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: "You have been blocked by the admin now you are not allowed to use this website again",
      });
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

    return res.json({
      success: true,
      message: "Google login successful.",
      token: generateToken(user),
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
  return res.json({
    success: true,
    user: req.user,
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
  return res.json({
    success: true,
    message: "Logout successful. Clear token on frontend.",
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
        userProfile: true,
        providerProfile: true,
      },
    });

    if (!user) {
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

    const token = generateToken(user);

    const { referenceSelfie, ...safeUser } = user;

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: safeUser,
    });
  } catch (error) {
    console.error("LOGIN_MOBILE_OTP_ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Login failed.",
      error: error.message,
    });
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

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No account found with this phone number.",
      });
    }

    const otp = "1234";

    await prisma.otpToken.create({
      data: {
        phone,
        otp,
        type: "LOGIN_MOBILE",
        verified: false,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    return res.status(200).json({
      success: true,
      message: "Login OTP sent successfully. Use 1234 for demo.",
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

module.exports = {
  sendMobileOtp: exports.sendMobileOtp,
  verifyMobileOtp: exports.verifyMobileOtp,
  sendEmailOtp: exports.sendEmailOtp,
  verifyEmailOtp: exports.verifyEmailOtp,

  register,
  login: exports.login,
  googleLogin: exports.googleLogin,
  googleRegisterProfile: exports.googleRegisterProfile,
  uploadProfileImage: exports.uploadProfileImage,
  me: exports.me,
  updateMe: exports.updateMe,
  logout: exports.logout,

  sendLoginMobileOtp,
  loginWithMobileOtp,
};
