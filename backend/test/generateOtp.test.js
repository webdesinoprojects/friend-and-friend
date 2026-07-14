const test = require("node:test");
const assert = require("node:assert/strict");
const generateOtp = require("../src/utils/generateOtp");

test("registration OTP is always a four-digit string", () => {
  for (let index = 0; index < 100; index += 1) assert.match(generateOtp(), /^\d{4}$/);
});
