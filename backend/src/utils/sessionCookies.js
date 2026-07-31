const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const USER_COOKIE = "buddybook_session";
const ADMIN_COOKIE = "buddybook_admin_session";
const APPLICATION_COOKIE = "buddybook_application_session";
const CSRF_COOKIE = "buddybook_csrf";

function isProduction() {
  return process.env.NODE_ENV === "production";
}

function cookieOptions({ httpOnly = true, maxAge, path = "/" } = {}) {
  const configuredSameSite = String(process.env.COOKIE_SAME_SITE || "").toLowerCase();
  const sameSite = ["lax", "strict", "none"].includes(configuredSameSite)
    ? configuredSameSite
    : "lax";
  return {
    httpOnly,
    secure: isProduction(),
    sameSite,
    path,
    ...(maxAge ? { maxAge } : {}),
  };
}

function issueCsrfCookie(res) {
  const token = crypto.randomBytes(32).toString("hex");
  res.cookie(CSRF_COOKIE, token, cookieOptions({
    httpOnly: false,
    maxAge: 24 * 60 * 60 * 1000,
  }));
  res.set?.("X-CSRF-Token", token);
  return token;
}

function issueUserSession(res, user) {
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, purpose: "user-session" },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
  res.cookie(USER_COOKIE, token, cookieOptions({ maxAge: 7 * 24 * 60 * 60 * 1000 }));
  issueCsrfCookie(res);
}

function issueAdminSession(res, admin) {
  const token = jwt.sign(
    { ...admin, purpose: "admin-session" },
    process.env.JWT_SECRET,
    { expiresIn: "8h" }
  );
  res.cookie(ADMIN_COOKIE, token, cookieOptions({ maxAge: 8 * 60 * 60 * 1000 }));
  issueCsrfCookie(res);
}

function issueApplicationSession(res, application) {
  const token = jwt.sign(
    { id: application.id, purpose: "application-review" },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );
  res.cookie(APPLICATION_COOKIE, token, cookieOptions({ maxAge: 30 * 24 * 60 * 60 * 1000 }));
  issueCsrfCookie(res);
}

function clearSessions(res) {
  for (const name of [USER_COOKIE, ADMIN_COOKIE, APPLICATION_COOKIE, CSRF_COOKIE]) {
    res.clearCookie(name, cookieOptions({ httpOnly: name !== CSRF_COOKIE }));
  }
}

function sessionToken(req, kind = "user") {
  const name = kind === "admin"
    ? ADMIN_COOKIE
    : kind === "application"
      ? APPLICATION_COOKIE
      : USER_COOKIE;
  return req.cookies?.[name] || "";
}

function parseCookieHeader(header = "") {
  return String(header).split(";").reduce((cookies, part) => {
    const index = part.indexOf("=");
    if (index < 0) return cookies;
    const name = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (name) cookies[name] = decodeURIComponent(value);
    return cookies;
  }, {});
}

module.exports = {
  USER_COOKIE,
  ADMIN_COOKIE,
  APPLICATION_COOKIE,
  CSRF_COOKIE,
  issueUserSession,
  issueAdminSession,
  issueApplicationSession,
  issueCsrfCookie,
  clearSessions,
  sessionToken,
  parseCookieHeader,
};
