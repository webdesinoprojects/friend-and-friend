const test = require("node:test");
const assert = require("node:assert/strict");
const createRateLimit = require("../src/middlewares/rateLimit.middleware");
const { parsePagination, paginationMeta } = require("../src/utils/pagination");
const TimedCache = require("../src/utils/timedCache");
const http = require("node:http");
const csrfProtection = require("../src/middlewares/csrf.middleware");
const {
  issueUserSession,
  USER_COOKIE,
  CSRF_COOKIE,
} = require("../src/utils/sessionCookies");

test("pagination clamps invalid and excessive values", () => {
  assert.deepEqual(parsePagination({ page: "-2", pageSize: "500" }), {
    page: 1,
    pageSize: 100,
    skip: 0,
    take: 100,
  });
  assert.deepEqual(paginationMeta({ page: 2, pageSize: 10, total: 25 }), {
    page: 2,
    pageSize: 10,
    total: 25,
    pageCount: 3,
    hasNextPage: true,
  });
});

test("rate limiter returns JSON and Retry-After after the configured limit", () => {
  const middleware = createRateLimit({ windowMs: 60_000, max: 1, keyPrefix: `test-${Date.now()}` });
  const headers = {};
  const req = { ip: "127.0.0.1", socket: {}, originalUrl: "/api/test" };
  let statusCode = 200;
  let body;
  const res = {
    set(name, value) { headers[name] = value; return this; },
    status(value) { statusCode = value; return this; },
    json(value) { body = value; return this; },
  };
  let nextCalls = 0;
  middleware(req, res, () => { nextCalls += 1; });
  middleware(req, res, () => { nextCalls += 1; });
  assert.equal(nextCalls, 1);
  assert.equal(statusCode, 429);
  assert.equal(body.success, false);
  assert.ok(Number(headers["Retry-After"]) >= 1);
});

test("timed public cache reuses values and stays bounded", () => {
  const cache = new TimedCache({ ttlMs: 60_000, maxEntries: 2 });
  cache.set("provider-1", { rating: 5 });
  assert.deepEqual(cache.get("provider-1"), { rating: 5 });
  cache.set("provider-2", { rating: 4 });
  cache.set("provider-3", { rating: 3 });
  assert.equal(cache.size, 2);
  assert.equal(cache.get("provider-1"), undefined);
});

test("user sessions are HttpOnly and CSRF cookies remain script-readable", () => {
  const previousSecret = process.env.JWT_SECRET;
  const previousNodeEnv = process.env.NODE_ENV;
  process.env.JWT_SECRET = "cookie-test-secret";
  process.env.NODE_ENV = "production";
  const cookies = [];
  issueUserSession({
    cookie(name, value, options) { cookies.push({ name, value, options }); },
  }, { id: "user-1", email: "user@example.com", role: "USER" });
  const session = cookies.find((cookie) => cookie.name === USER_COOKIE);
  const csrf = cookies.find((cookie) => cookie.name === CSRF_COOKIE);
  assert.equal(session.options.httpOnly, true);
  assert.equal(session.options.secure, true);
  assert.equal(session.options.sameSite, "none");
  assert.equal(csrf.options.httpOnly, false);
  if (previousSecret === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = previousSecret;
  if (previousNodeEnv === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = previousNodeEnv;
});

test("cookie-authenticated mutations require a matching CSRF header", () => {
  const request = (header) => ({
    method: "POST",
    path: "/api/bookings",
    cookies: {
      [USER_COOKIE]: "session",
      [CSRF_COOKIE]: "csrf-value",
    },
    get(name) { return name === "X-CSRF-Token" ? header : undefined; },
  });
  let status;
  let nextCalls = 0;
  const response = {
    status(value) { status = value; return this; },
    json() { return this; },
  };
  csrfProtection(request(), response, () => { nextCalls += 1; });
  assert.equal(status, 403);
  csrfProtection(request("csrf-value"), response, () => { nextCalls += 1; });
  assert.equal(nextCalls, 1);
});

test("unknown API routes return explicit JSON with no-store caching", async () => {
  const previousVercel = process.env.VERCEL;
  process.env.VERCEL = "1";
  const app = require("../src/server");
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const address = server.address();
    const response = await fetch(`http://127.0.0.1:${address.port}/api/does-not-exist`);
    const body = await response.json();
    assert.equal(response.status, 404);
    assert.equal(response.headers.get("cache-control"), "private, no-store");
    assert.equal(body.success, false);
    assert.match(body.message, /API route not found/);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    if (previousVercel === undefined) delete process.env.VERCEL;
    else process.env.VERCEL = previousVercel;
  }
});
