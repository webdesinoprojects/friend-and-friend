const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");
const { activateIfExpired, isAccountDisabled, publicAccountState } = require("../utils/accountLifecycle");

async function authenticate(req, res, next, { allowDisabled = false } = {}) {
  try {
    const authHeader = req.headers.authorization || (req.query?.token ? `Bearer ${req.query.token}` : "");
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Token missing. Please login again." });
    }

    const decoded = jwt.verify(authHeader.slice(7), process.env.JWT_SECRET);
    let user = await prisma.user.findUnique({
      where: { id: decoded.id },
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
        isBlocked: true,
        blockReason: true,
        disabledAt: true,
        disabledUntil: true,
        providerProfile: true,
        userProfile: true,
      },
    });

    if (!user) {
      return res.status(401).json({ success: false, accountDeleted: true, message: "This account no longer exists." });
    }
    user = await activateIfExpired(user);
    if (user.isBlocked) {
      return res.status(403).json({ success: false, message: "This account has been blocked by an administrator." });
    }
    if (!allowDisabled && isAccountDisabled(user)) {
      return res.status(423).json({
        success: false,
        message: "Your account is temporarily disabled. Reactivate it from Settings to continue.",
        ...publicAccountState(user),
      });
    }

    req.user = user;
    return next();
  } catch {
    return res.status(401).json({ success: false, message: "Invalid or expired token." });
  }
}

function protect(req, res, next) {
  return authenticate(req, res, next);
}

protect.allowDisabled = function allowDisabled(req, res, next) {
  return authenticate(req, res, next, { allowDisabled: true });
};

module.exports = protect;
