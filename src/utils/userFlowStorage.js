const KEYS = {
  bookings: "buddybook_bookings",
  payments: "buddybook_payments",
  reviews: "buddybook_reviews",
  watchlist: "buddybook_watchlist",
  selectedProvider: "buddybook_selected_provider",
};

export function readList(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function writeList(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent("buddybook:data-changed", { detail: key }));
}

export const getBookings = () => readList(KEYS.bookings);
export const getPayments = () => readList(KEYS.payments);
export const getReviews = () => readList(KEYS.reviews);
export const getWatchlist = () => readList(KEYS.watchlist);

export function addBooking(booking) {
  writeList(KEYS.bookings, [booking, ...getBookings()]);
  return booking;
}

export function updateBooking(bookingId, updates) {
  const next = getBookings().map((booking) =>
    booking.id === bookingId ? { ...booking, ...updates } : booking
  );
  writeList(KEYS.bookings, next);
}

export function addReview(review) {
  const createdAt = new Date().toISOString();
  const nextReview = {
    id: review.id || `REV-${Date.now()}`,
    rating: Number(review.rating || 5),
    description: String(review.description || "").trim(),
    createdAt,
    ...review,
  };

  const withoutDuplicate = getReviews().filter(
    (item) =>
      !(
        item.bookingId === nextReview.bookingId &&
        item.reviewerRole === nextReview.reviewerRole
      )
  );

  writeList(KEYS.reviews, [nextReview, ...withoutDuplicate]);
  return nextReview;
}

export function getReviewForBooking(bookingId, reviewerRole) {
  return getReviews().find(
    (review) => review.bookingId === bookingId && review.reviewerRole === reviewerRole
  );
}

export function getReceivedReviews(role) {
  return getReviews().filter((review) => review.targetRole === role);
}

export function addPayment(payment) {
  writeList(KEYS.payments, [payment, ...getPayments()]);
  return payment;
}

export function toggleWatchlist(provider) {
  const current = getWatchlist();
  const exists = current.some((item) => item.id === provider.id);
  const next = exists
    ? current.filter((item) => item.id !== provider.id)
    : [provider, ...current];
  writeList(KEYS.watchlist, next);
  return { saved: !exists, items: next };
}

export function isInWatchlist(providerId) {
  return getWatchlist().some((item) => item.id === providerId);
}

export function rememberProvider(provider) {
  sessionStorage.setItem(KEYS.selectedProvider, JSON.stringify(provider));
}

export function getRememberedProvider(providerId) {
  try {
    const provider = JSON.parse(
      sessionStorage.getItem(KEYS.selectedProvider) || "null"
    );
    return provider?.id === providerId ? provider : null;
  } catch {
    return null;
  }
}

export function subscribeToUserData(callback) {
  const listener = () => callback();
  window.addEventListener("storage", listener);
  window.addEventListener("buddybook:data-changed", listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener("buddybook:data-changed", listener);
  };
}

export function createPaidBooking({
  provider,
  service,
  date,
  time,
  duration,
  paymentMethod,
}) {
  const amount = Number(provider.price || 0) * Number(duration || 1);
  const createdAt = new Date().toISOString();
  const bookingId = `BBK-${Date.now()}`;
  const paymentId = `PAY-${Date.now()}`;

  const booking = {
    id: bookingId,
    providerId: provider.id,
    providerName: provider.name,
    providerImage: provider.image,
    service,
    activity: service,
    date,
    time,
    duration: `${duration} Hour${Number(duration) > 1 ? "s" : ""}`,
    durationHours: Number(duration),
    amount,
    status: "CONFIRMED",
    paymentStatus: "PAID",
    paymentMethod,
    paymentId,
    locationStatus: "Ready to share",
    createdAt,
  };

  const payment = {
    id: paymentId,
    bookingId,
    providerId: provider.id,
    providerName: provider.name,
    providerImage: provider.image,
    service,
    date,
    time,
    amount,
    method: paymentMethod,
    status: "PAID",
    createdAt,
  };

  addBooking(booking);
  addPayment(payment);
  return { booking, payment };
}

export { KEYS };
