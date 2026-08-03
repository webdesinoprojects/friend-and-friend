import test from "node:test";
import assert from "node:assert/strict";
import {
  clearQueryCache,
  fetchQuery,
  getQueryData,
  invalidateQueries,
} from "../src/utils/queryCache.js";

test("deduplicates simultaneous requests and reuses fresh data", async () => {
  clearQueryCache();
  let calls = 0;
  const loader = async () => {
    calls += 1;
    return ["booking-1"];
  };

  const [first, second] = await Promise.all([
    fetchQuery("bookings:test", loader),
    fetchQuery("bookings:test", loader),
  ]);
  const third = await fetchQuery("bookings:test", loader);

  assert.deepEqual(first, ["booking-1"]);
  assert.deepEqual(second, ["booking-1"]);
  assert.deepEqual(third, ["booking-1"]);
  assert.equal(calls, 1);
});

test("invalidates only matching query groups", async () => {
  clearQueryCache();
  await fetchQuery("bookings:user", async () => [1]);
  await fetchQuery("reports:user", async () => [2]);

  invalidateQueries("bookings:");

  assert.equal(getQueryData("bookings:user"), null);
  assert.deepEqual(getQueryData("reports:user"), [2]);
});

test("returns the supplied fallback while a prefetched query is still pending", async () => {
  clearQueryCache();
  let resolveRequest;
  const pending = fetchQuery(
    "bookings:pending",
    () => new Promise((resolve) => {
      resolveRequest = resolve;
    })
  );

  assert.deepEqual(getQueryData("bookings:pending", []), []);
  await Promise.resolve();
  resolveRequest(["booking-1"]);
  await pending;
  assert.deepEqual(getQueryData("bookings:pending", []), ["booking-1"]);
});

test("persists allowed page data per account without persisting auth queries", async () => {
  const previousLocalStorage = globalThis.localStorage;
  const previousSessionStorage = globalThis.sessionStorage;
  const localRows = new Map([
    ["PPlusOne_auth_user", JSON.stringify({ id: "user-1", role: "USER" })],
  ]);
  const sessionRows = new Map();
  const storage = (rows) => ({
    getItem: (key) => rows.get(key) ?? null,
    setItem: (key, value) => rows.set(key, String(value)),
    removeItem: (key) => rows.delete(key),
  });

  globalThis.localStorage = storage(localRows);
  globalThis.sessionStorage = storage(sessionRows);

  try {
    const first = await import(`../src/utils/queryCache.js?persist-a=${Date.now()}`);
    first.setQueryData("bookings:{}", ["booking-1"]);
    first.setQueryData("auth:me", { id: "user-1" });

    const raw = sessionRows.get("PPlusOne_page_cache_v1:user-1");
    assert.match(raw, /booking-1/);
    assert.doesNotMatch(raw, /auth:me/);

    const second = await import(`../src/utils/queryCache.js?persist-b=${Date.now()}`);
    assert.deepEqual(second.getQueryData("bookings:{}", []), ["booking-1"]);
    assert.equal(second.getQueryData("auth:me"), null);
  } finally {
    if (previousLocalStorage === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = previousLocalStorage;
    if (previousSessionStorage === undefined) delete globalThis.sessionStorage;
    else globalThis.sessionStorage = previousSessionStorage;
  }
});
