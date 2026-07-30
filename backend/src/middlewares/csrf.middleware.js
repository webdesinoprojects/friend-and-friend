const crypto = require("crypto");
const {
  USER_COOKIE,
  ADMIN_COOKIE,
  APPLICATION_COOKIE,
  CSRF_COOKIE,
} = require("../utils/sessionCookies");

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const SESSION_ESTABLISHING_PATHS = new Set([
  "/api/auth/login",
  "/api/auth/google",
  "/api/auth/login-mobile-otp",
  "/api/auth/register",
  "/api/admin/login",
]);

function equalTokens(left, right) {
  const a = Buffer.from(String(left || ""));
  const b = Buffer.from(String(right || ""));
  return a.length > 0 && a.length === b.length && crypto.timingSafeEqual(a, b);
}

function csrfProtection(req, res, next) {
  if (SAFE_METHODS.has(req.method) || SESSION_ESTABLISHING_PATHS.has(req.path)) return next();

  const hasSession = Boolean(
    req.cookies?.[USER_COOKIE] ||
    req.cookies?.[ADMIN_COOKIE] ||
    req.cookies?.[APPLICATION_COOKIE]
  );
  if (!hasSession) return next();

  const cookieToken = req.cookies?.[CSRF_COOKIE];
  const headerToken = req.get("X-CSRF-Token");
  if (!equalTokens(cookieToken, headerToken)) {
    return res.status(403).json({
      success: false,
      message: "Security token missing or invalid. Refresh the page and try again.",
    });
  }
  return next();
}

module.exports = csrfProtection;
