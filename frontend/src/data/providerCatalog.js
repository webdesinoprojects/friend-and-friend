import api from "../api/api";

export async function fetchProviders() {
  const endpoint = import.meta.env.VITE_PROVIDERS_ENDPOINT || "/providers";

  try {
    const response = await api.get(endpoint, {
      params: { status: "APPROVED", verified: true },
    });
    const rows = extractRows(response.data);
    return {
      providers: rows.map(normalizeProvider).filter((item) => item.id),
      demo: false,
    };
  } catch {
    return { providers: [], demo: false };
  }
}

export async function fetchProvider(providerId) {
  const remembered = readRemembered(providerId);
  if (remembered) return remembered;

  const base = import.meta.env.VITE_PROVIDERS_ENDPOINT || "/providers";

  try {
    const response = await api.get(`${base}/${providerId}`);
    return normalizeProvider(
      response.data?.provider || response.data?.data?.provider || response.data?.data
    );
  } catch {
    return null;
  }
}

export function normalizeProvider(raw, index = 0) {
  const user = raw?.user || raw?.account || raw || {};
  const profile = raw?.providerProfile || raw?.profile || raw || {};
  const activities = normalizeActivities(
    profile.activities ||
      profile.services ||
      raw?.activities ||
      profile.hobbies ||
      raw?.hobbies
  );
  const profileImages = normalizeImages(
    profile.profileImages || raw?.profileImages || raw?.images
  );
  const price = parsePrice(
    profile.hourlyPrice ||
      profile.hourlyRate ||
      profile.pricePerHour ||
      raw?.hourlyRate ||
      raw?.price
  );
  const firstStoredImage = getStoredImage(
    Array.isArray(profile.profileImages)
      ? profile.profileImages[0]
      : Array.isArray(raw?.profileImages)
      ? raw.profileImages[0]
      : Array.isArray(raw?.images)
      ? raw.images[0]
      : null
  );
  const image =
    firstStoredImage?.thumbnailUrl ||
    firstStoredImage?.url ||
    profileImages[0] ||
    user.avatar ||
    user.profileImage ||
    profile.avatar ||
    profile.profileImage ||
    raw?.image ||
    "";
  const questions = Array.isArray(profile.profileQuestions)
    ? profile.profileQuestions
    : [];
  const age =
    raw?.age ||
    profile.age ||
    getQuestionAnswer(questions, "age") ||
    "";

  return {
    id: raw?.id || raw?._id || user.id || user._id || `provider-${index}`,
    userId: profile.userId || raw?.userId || user.id || user._id || "",
    providerUserId: profile.userId || raw?.providerUserId || raw?.userId || user.id || user._id || "",
    name:
      user.fullName ||
      raw?.fullName ||
      raw?.name ||
      profile.displayName ||
      "Verified Buddy",
    profession:
      profile.headline ||
      profile.profession ||
      profile.occupation ||
      "Verified companion",
    bio:
      profile.bio ||
      raw?.bio ||
      "Friendly verified companion for safe public activities.",
    city:
      user.city ||
      profile.availableCity ||
      profile.city ||
      raw?.city ||
      "City not added",
    state: user.state || profile.state || raw?.state || "State not added",
    gender: user.gender || profile.gender || raw?.gender || "Not specified",
    activities: activities.length ? activities : ["Public Meetup"],
    price,
    rating: Number(profile.rating || raw?.rating || raw?.averageRating || 0),
    reviews: Number(profile.reviewCount || raw?.reviewCount || (Array.isArray(raw?.reviews) ? raw.reviews.length : 0)),
    reviewItems: Array.isArray(raw?.reviews)
      ? raw.reviews
      : Array.isArray(profile.reviewItems)
        ? profile.reviewItems
        : [],
    totalBookings: Number(raw?.totalBookings || profile.totalBookings || raw?.bookingCount || profile.completedBookings || raw?.completedBookings || 0),
    totalSpending: Number(raw?.totalSpending || profile.totalSpending || raw?.amountSpent || profile.amountSpent || raw?.totalEarning || profile.totalEarning || 0),
    age,
    available: profile.available ?? profile.isAvailable ?? raw?.available ?? true,
    publicMeetups: Boolean(profile.providerSafetyAgreement ?? raw?.providerSafetyAgreement),
    languages: profile.languages || raw?.languages || "",
    availabilityDays: profile.availabilityDays || raw?.availabilityDays || "",
    education: profile.education || raw?.education || "",
    height: profile.height || raw?.height || "",
    questions,
    imageCount: Number(raw?.imageCount || profile.imageCount || profileImages.length || 0),
    images: profileImages.length ? profileImages : [image].filter(Boolean),
    image,
  };
}

function getQuestionAnswer(questions, key) {
  const match = questions.find((item) => item?.key === key || item?.question === key);
  return String(match?.answer || "").trim();
}

function extractRows(payload) {
  const rows =
    payload?.providers ||
    payload?.data?.providers ||
    payload?.data?.items ||
    payload?.data ||
    payload?.items ||
    [];
  return Array.isArray(rows) ? rows : [];
}

function normalizeActivities(items) {
  if (!items) return [];
  if (Array.isArray(items)) {
    return items
      .map((item) =>
        typeof item === "string" ? item : item?.name || item?.title || item?.label
      )
      .filter(Boolean);
  }

  if (typeof items === "string") {
    return items
      .split(/[,;]+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [String(items)].filter(Boolean);
}

function normalizeImages(images) {
  if (Array.isArray(images)) {
    return images
      .map((image) => getStoredImage(image)?.url)
      .filter(Boolean);
  }
  if (typeof images === "string") {
    try {
      const parsed = JSON.parse(images);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
    } catch {
      return images
        .split(/[,;]+/)
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }
  return [];
}

function getStoredImage(image) {
  if (!image) return null;
  if (typeof image === "string") {
    if (image.startsWith("data:image/")) return null;
    return { url: image, thumbnailUrl: image };
  }
  if (typeof image === "object" && image.url) {
    return {
      url: image.url,
      thumbnailUrl: image.thumbnailUrl || image.url,
    };
  }
  return null;
}

function parsePrice(value) {
  if (typeof value === "number") return value;
  if (!value) return 0;
  const parsed = Number(String(value).replace(/[^\d.]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function readRemembered(providerId) {
  try {
    const provider = JSON.parse(
      sessionStorage.getItem("buddybook_selected_provider") || "null"
    );
    return provider?.id === providerId ? provider : null;
  } catch {
    return null;
  }
}
