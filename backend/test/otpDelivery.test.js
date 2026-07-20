const test = require("node:test");
const assert = require("node:assert/strict");

const { sendEmailOtp } = require("../src/utils/otpDelivery");

const originalFetch = global.fetch;
const originalEnvironment = {
  RESEND_TRANSACTIONAL_API_KEY: process.env.RESEND_TRANSACTIONAL_API_KEY,
  RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
  RESEND_FROM_NAME: process.env.RESEND_FROM_NAME,
  RESEND_TEST_MODE: process.env.RESEND_TEST_MODE,
};

test.afterEach(() => {
  global.fetch = originalFetch;
  for (const [key, value] of Object.entries(originalEnvironment)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

test("sendEmailOtp sends the registration code through Resend", async () => {
  process.env.RESEND_TRANSACTIONAL_API_KEY = "test-api-key";
  process.env.RESEND_FROM_EMAIL = "otp@example.com";
  process.env.RESEND_FROM_NAME = "BuddyBOOK";
  process.env.RESEND_TEST_MODE = "false";

  let request;
  global.fetch = async (url, options) => {
    request = { url, options };
    return { ok: true, status: 200, json: async () => ({ id: "message-id" }) };
  };

  const result = await sendEmailOtp("member@example.com", "482913");
  const body = JSON.parse(request.options.body);

  assert.equal(request.url, "https://api.resend.com/emails");
  assert.equal(request.options.method, "POST");
  assert.equal(request.options.headers.authorization, "Bearer test-api-key");
  assert.equal(body.from, "BuddyBOOK <otp@example.com>");
  assert.deepEqual(body.to, ["member@example.com"]);
  assert.match(body.subject, /482913/);
  assert.match(body.html, /482913/);
  assert.equal(result.id, "message-id");
  assert.equal(result.testMode, false);
});

test("sendEmailOtp requires Resend server configuration", async () => {
  delete process.env.RESEND_TRANSACTIONAL_API_KEY;
  await assert.rejects(() => sendEmailOtp("member@example.com", "482913"), /not configured/);
});

test("sendEmailOtp surfaces a Resend delivery failure", async () => {
  process.env.RESEND_TRANSACTIONAL_API_KEY = "test-api-key";
  process.env.RESEND_FROM_EMAIL = "otp@example.com";
  process.env.RESEND_TEST_MODE = "false";
  global.fetch = async () => ({ ok: false, status: 403, json: async () => ({ message: "Domain is not verified" }) });
  await assert.rejects(() => sendEmailOtp("member@example.com", "482913"), /Domain is not verified/);
});
