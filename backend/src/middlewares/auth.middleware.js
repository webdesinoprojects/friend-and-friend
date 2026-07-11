const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");

async function protect(req, res, next) {
  try {
    const authHeader = req.headers.authorization || (req.query?.token ? `Bearer ${req.query.token}` : "");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Token missing. Please login again.",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
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
        providerProfile: true,
        userProfile: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found. Please login again.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
}

module.exports = protect;
