const KEYS = {
  bookings: "buddybook_bookings",
  payments: "buddybook_payments",
  reviews: "buddybook_reviews",
  watchlist: "buddybook_watchlist",
  chats: "buddybook_chats",
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

export function cacheBookings(bookings) {
  const next = Array.isArray(bookings) ? bookings : [];
  if (JSON.stringify(getBookings()) !== JSON.stringify(next)) writeList(KEYS.bookings, next);
  return next;
}

export const getBookings = () => readList(KEYS.bookings);
export const getPayments = () => readList(KEYS.payments);
export const getReviews = () => readList(KEYS.reviews);
export const getWatchlist = () => readList(KEYS.watchlist);
export const getChats = () => readList(KEYS.chats);

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

export function cancelBooking(bookingId, reason) {
  const cancelledAt = new Date().toISOString();
  updateBooking(bookingId, {
    status: "CANCELLED",
    cancellationReason: String(reason || "").trim(),
    cancelledAt,
    chatClosed: true,
  });
  addChatMessage({
    bookingId,
    senderRole: "SYSTEM",
    text: `Booking cancelled${reason ? `: ${reason}` : "."}`,
    system: true,
    createdAt: cancelledAt,
  });
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

export function addChatThread(booking) {
  const current = getChats();
  const exists = current.some((chat) => chat.bookingId === booking.id);
  if (exists) return current.find((chat) => chat.bookingId === booking.id);
  const thread = {
    id: `CHAT-${booking.id || Date.now()}`,
    bookingId: booking.id,
    providerId: booking.providerId,
    providerName: booking.providerName,
    providerImage: booking.providerImage,
    userId: booking.userId,
    userName: booking.userName || "BuddyBOOK user",
    service: booking.service || booking.activity,
    status: booking.status || "CONFIRMED",
    closed: false,
    messages: [
      {
        id: `MSG-${Date.now()}`,
        senderRole: "SYSTEM",
        text: "Booking confirmed. You can now chat about meetup details.",
        system: true,
        createdAt: new Date().toISOString(),
      },
    ],
    createdAt: new Date().toISOString(),
  };
  writeList(KEYS.chats, [thread, ...current]);
  return thread;
}

export function deleteLocalChat(bookingId) {
  writeList(KEYS.chats, getChats().filter((chat) => chat.bookingId !== bookingId && chat.id !== bookingId));
}

export function deleteLocalChatMessage(bookingId, messageId) {
  const next = getChats().map((chat) =>
    chat.bookingId === bookingId || chat.id === bookingId
      ? { ...chat, messages: (chat.messages || []).filter((message) => message.id !== messageId) }
      : chat
  );
  writeList(KEYS.chats, next);
}

export function editLocalChatMessage(bookingId, messageId, text) {
  const next = getChats().map((chat) =>
    chat.bookingId === bookingId || chat.id === bookingId
      ? {
          ...chat,
          messages: (chat.messages || []).map((message) =>
            message.id === messageId ? { ...message, text: String(text || "").trim() } : message
          ),
        }
      : chat
  );
  writeList(KEYS.chats, next);
}

export function addChatMessage({ bookingId, senderRole, text, system = false, createdAt, type = "TEXT", mediaUrl, durationSeconds }) {
  const message = {
    id: `MSG-${Date.now()}`,
    senderRole,
    type,
    text: String(text || "").trim(),
    mediaUrl: mediaUrl || null,
    durationSeconds: durationSeconds ? Number(durationSeconds) : null,
    system,
    createdAt: createdAt || new Date().toISOString(),
  };
  if (!message.text && !message.mediaUrl) return null;
  const next = getChats().map((chat) =>
    chat.bookingId === bookingId
      ? {
          ...chat,
          closed: chat.closed || message.text.toLowerCase().includes("booking cancelled"),
          messages: [...(chat.messages || []), message],
        }
      : chat
  );
  writeList(KEYS.chats, next);
  return message;
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

export function removeMissingWatchlistProviders(providerIds) {
  const missingIds = new Set(providerIds);
  const next = getWatchlist().filter((item) => !missingIds.has(item.id));
  writeList(KEYS.watchlist, next);
  return next;
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
  user,
  bookingOverride,
}) {
  const amount = Number(provider.price || 0) * Number(duration || 1);
  const createdAt = new Date().toISOString();
  const bookingId = bookingOverride?.id || `BBK-${Date.now()}`;
  const paymentId = `PAY-${Date.now()}`;

  const booking = {
    id: bookingId,
    code: bookingOverride?.code,
    providerId: provider.id,
    providerName: provider.name,
    providerImage: provider.image,
    userId: user?.id || user?._id || null,
    userName: user?.fullName || "BuddyBOOK user",
    service,
    activity: service,
    date,
    time,
    duration: `${duration} Hour${Number(duration) > 1 ? "s" : ""}`,
    durationHours: Number(duration),
    amount: Number(bookingOverride?.amount || amount),
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
  addChatThread(booking);
  return { booking, payment };
}

export { KEYS };
