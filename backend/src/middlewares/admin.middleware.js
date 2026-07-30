const jwt = require("jsonwebtoken");
const { sessionToken } = require("../utils/sessionCookies");

function adminOnly(req, res, next) {
  const token = sessionToken(req, "admin");

  if (!token) {
    return res.status(401).json({ success: false, message: "Admin token is required." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "ADMIN" || decoded.purpose !== "admin-session") {
      return res.status(403).json({ success: false, message: "Admin access only." });
    }

    req.admin = decoded;
    return next();
  } catch {
    return res.status(401).json({ success: false, message: "Invalid admin token." });
  }
}

module.exports = adminOnly;
