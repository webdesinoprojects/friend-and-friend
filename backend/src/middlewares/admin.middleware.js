const jwt = require("jsonwebtoken");

function adminOnly(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";

  if (!token) {
    return res.status(401).json({ success: false, message: "Admin token is required." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Admin access only." });
    }

    req.admin = decoded;
    return next();
  } catch {
    return res.status(401).json({ success: false, message: "Invalid admin token." });
  }
}

module.exports = adminOnly;
