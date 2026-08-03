import api from "./api";
import {
  createQueryKey,
  fetchQuery,
  getQueryData,
  invalidateQueries,
} from "../utils/queryCache";

const BOOKINGS_CACHE_PREFIX = "bookings:";

export async function createBooking(payload) {
  const { data } = await api.post("/bookings", payload);
  invalidateQueries(BOOKINGS_CACHE_PREFIX);
  return data?.booking || data?.data || data;
}

export async function createBookingRequest(payload) {
  const { data } = await api.post("/bookings/request", payload);
  invalidateQueries(BOOKINGS_CACHE_PREFIX);
  return data?.booking || data?.data || data;
}

export async function acceptBookingApi(bookingId) {
  const { data } = await api.post(`/bookings/${bookingId}/accept`);
  invalidateQueries(BOOKINGS_CACHE_PREFIX);
  return data?.booking || data?.data || data;
}

export async function createRazorpayOrder(payload) {
  const { data } = await api.post("/bookings/razorpay/order", payload);
  return data;
}

export async function verifyRazorpayPayment(payload) {
  const { data } = await api.post("/bookings/razorpay/verify", payload);
  invalidateQueries(BOOKINGS_CACHE_PREFIX);
  return data?.booking || data?.data || data;
}

export function getCachedBookings(params = {}) {
  return getQueryData(createQueryKey("bookings", params), []);
}

export function listBookings(params = {}, options = {}) {
  const key = createQueryKey("bookings", params);
  return fetchQuery(
    key,
    async () => {
      const { data } = await api.get("/bookings", { params });
      return Array.isArray(data?.data) ? data.data : [];
    },
    { staleTime: 30_000, ...options }
  );
}

export async function getUserDashboardSummary() {
  const { data } = await api.get("/bookings/summary");
  return data?.data || { totalSpending: 0, savedProviders: 0 };
}

export async function getBookedUserProfile(userId) {
  const { data } = await api.get(`/bookings/users/${userId || "me"}/profile`, { timeout: 30000 });
  return data?.data || data;
}

export async function cancelBookingApi(bookingId, reason, category) {
  const { data } = await api.post(`/bookings/${bookingId}/cancel`, { reason, category });
  invalidateQueries(BOOKINGS_CACHE_PREFIX);
  return data?.booking || data?.data || data;
}

export async function completeBookingApi(bookingId) {
  const { data } = await api.post(`/bookings/${bookingId}/end`);
  invalidateQueries(BOOKINGS_CACHE_PREFIX);
  return data?.booking || data?.data || data;
}

export async function revealBookingStartPin(bookingId) {
  const { data } = await api.get(`/bookings/${bookingId}/start-pin`);
  return data?.booking || data?.data || data;
}

export async function startBookingMeeting(bookingId, pin) {
  const { data } = await api.post(`/bookings/${bookingId}/start`, { pin });
  invalidateQueries(BOOKINGS_CACHE_PREFIX);
  return data?.booking || data?.data || data;
}

export async function getBookingEndCode(bookingId) {
  const { data } = await api.get(`/bookings/${bookingId}/end-code`);
  return data?.booking || data?.data || data;
}

export async function verifyBookingEndCode(bookingId, otp) {
  const { data } = await api.post(`/bookings/${bookingId}/end-code/verify`, { otp });
  invalidateQueries(BOOKINGS_CACHE_PREFIX);
  return data?.booking || data?.data || data;
}

export async function endBookingMeeting(bookingId) {
  const { data } = await api.post(`/bookings/${bookingId}/end`);
  invalidateQueries(BOOKINGS_CACHE_PREFIX);
  return data?.booking || data?.data || data;
}

export async function createExtensionOrder(bookingId) {
  const { data } = await api.post(`/bookings/${bookingId}/extensions/razorpay/order`);
  return data;
}

export async function verifyExtensionPayment(bookingId, payload) {
  const { data } = await api.post(`/bookings/${bookingId}/extensions/razorpay/verify`, payload);
  invalidateQueries(BOOKINGS_CACHE_PREFIX);
  return data?.booking || data?.data || data;
}
