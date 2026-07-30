import test from "node:test";
import assert from "node:assert/strict";
import {
  buildProviderProfileLink,
  normalizeActivities,
  providerMatchesActivities,
  readPublicFilters,
} from "../src/utils/providerFilters.js";

test("normalizes and deduplicates multiple activities", () => {
  assert.deepEqual(normalizeActivities([" Cafe meet ", "events", "CAFE MEET", "All"]), ["Cafe meet", "events"]);
});

test("matches providers when any selected activity is offered", () => {
  assert.equal(providerMatchesActivities(["Football", "Cafe meet"], ["Events", "cafe meet"]), true);
  assert.equal(providerMatchesActivities(["Football"], ["Events", "Cricket"]), false);
  assert.equal(providerMatchesActivities(["Football"], []), true);
});

test("carries every selected activity into a provider link", () => {
  const link = buildProviderProfileLink("provider-1", ["Cafe meet", "Events", "Cricket"]);
  const url = new URL(link, "https://buddybook.test");
  assert.deepEqual(url.searchParams.getAll("activities"), ["Cafe meet", "Events", "Cricket"]);
});

test("restores filters and page-related query state without losing activities", () => {
  const params = new URLSearchParams("city=Delhi&activities=Cafe+meet&activities=Events");
  const filters = readPublicFilters(params, {
    keyword: "",
    city: "All",
    state: "All",
    gender: "All",
    maxPrice: "All",
    rating: "All",
    activities: [],
  });
  assert.equal(filters.city, "Delhi");
  assert.deepEqual(filters.activities, ["Cafe meet", "Events"]);
});
