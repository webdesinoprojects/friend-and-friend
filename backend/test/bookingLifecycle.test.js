const test = require("node:test");
const assert = require("node:assert/strict");

const { __test } = require("../src/controllers/booking.controller");

test("meeting start PIN expiry is exactly fourteen days", () => {
  const start = new Date("2026-07-20T10:00:00.000Z");
  assert.equal(__test.addDays(start, 14).toISOString(), "2026-08-03T10:00:00.000Z");
});

test("each extension is ten percent cheaper than the previous hour", () => {
  assert.equal(__test.extensionPrice({ lastHourlyPrice: 500, amount: 500, durationHours: 1 }), 450);
  assert.equal(__test.extensionPrice({ lastHourlyPrice: 450, amount: 950, durationHours: 2 }), 405);
  assert.equal(__test.extensionPrice({ lastHourlyPrice: 405, amount: 1355, durationHours: 3 }), 365);
});

test("one paid extension adds exactly one hour", () => {
  const end = new Date("2026-07-20T12:00:00.000Z");
  assert.equal(__test.addHours(end, 1).toISOString(), "2026-07-20T13:00:00.000Z");
});
