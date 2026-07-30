export function sameText(left, right) {
  return String(left || "").trim().toLocaleLowerCase() === String(right || "").trim().toLocaleLowerCase();
}

export function normalizeActivities(values) {
  const rows = Array.isArray(values) ? values : [values];
  const unique = new Map();
  rows
    .flatMap((value) => String(value || "").split(","))
    .map((value) => value.trim())
    .filter((value) => value && value !== "All")
    .forEach((value) => {
      const key = value.toLocaleLowerCase();
      if (!unique.has(key)) unique.set(key, value);
    });
  return Array.from(unique.values());
}

export function providerMatchesActivities(providerActivities, selectedActivities) {
  const offered = normalizeActivities(providerActivities);
  const selected = normalizeActivities(selectedActivities);
  return !selected.length || selected.some((choice) => offered.some((activity) => sameText(activity, choice)));
}

export function buildProviderProfileLink(providerId, selectedActivities, returnTo = "") {
  const query = new URLSearchParams();
  normalizeActivities(selectedActivities).forEach((activity) => query.append("activities", activity));
  if (returnTo) query.set("returnTo", returnTo);
  const suffix = query.toString();
  return `/providers/${providerId}${suffix ? `?${suffix}` : ""}`;
}

export function readPublicFilters(searchParams, defaults) {
  return {
    ...defaults,
    keyword: searchParams.get("keyword") || "",
    city: searchParams.get("city") || "All",
    state: searchParams.get("state") || "All",
    gender: searchParams.get("gender") || "All",
    maxPrice: searchParams.get("maxPrice") || "All",
    rating: searchParams.get("rating") || "All",
    activities: normalizeActivities(searchParams.getAll("activities")),
  };
}
