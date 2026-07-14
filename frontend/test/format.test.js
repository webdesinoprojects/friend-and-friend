import test from "node:test";
import assert from "node:assert/strict";
import { formatRupees } from "../src/utils/format.js";

test("formats Indian currency for booking and admin screens", () => {
  assert.equal(formatRupees(1250), "₹1.3k");
});
