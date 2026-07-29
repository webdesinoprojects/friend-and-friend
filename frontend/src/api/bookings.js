import api from "./api";
import { cacheBookings } from "../utils/userFlowStorage";

export async function createBooking(payload) {
  const { data } = await api.post("/bookings", payload);
  return data?.booking || data?.data || data;
}

export async function createBookingRequest(payload) {
  const { data } = await api.post("/bookings/request", payload);
  return data?.booking || data?.data || data;
}

export async function acceptBookingApi(bookingId) {
  const { data } = await api.post(`/bookings/${bookingId}/accept`);
  return data?.booking || data?.data || data;
}

export async function createRazorpayOrder(payload) {
  const { data } = await api.post("/bookings/razorpay/order", payload);
  return data;
}

export async function verifyRazorpayPayment(payload) {
  const { data } = await api.post("/bookings/razorpay/verify", payload);
  return data?.booking || data?.data || data;
}

export async function listBookings() {
  const { data } = await api.get("/bookings");
  return cacheBookings(Array.isArray(data?.data) ? data.data : []);
}

export async function cancelBookingApi(bookingId, reason, category) {
  const { data } = await api.post(`/bookings/${bookingId}/cancel`, { reason, category });
  return data?.booking || data?.data || data;
}

export async function completeBookingApi(bookingId) {
  const { data } = await api.post(`/bookings/${bookingId}/end`);
  return data?.booking || data?.data || data;
}

export async function revealBookingStartPin(bookingId) {
  const { data } = await api.get(`/bookings/${bookingId}/start-pin`);
  return data?.booking || data?.data || data;
}

export async function startBookingMeeting(bookingId, pin) {
  const { data } = await api.post(`/bookings/${bookingId}/start`, { pin });
  return data?.booking || data?.data || data;
}

export async function getBookingEndCode(bookingId) {
  const { data } = await api.get(`/bookings/${bookingId}/end-code`);
  return data?.booking || data?.data || data;
}

export async function verifyBookingEndCode(bookingId, otp) {
  const { data } = await api.post(`/bookings/${bookingId}/end-code/verify`, { otp });
  return data?.booking || data?.data || data;
}

export async function endBookingMeeting(bookingId) {
  const { data } = await api.post(`/bookings/${bookingId}/end`);
  return data?.booking || data?.data || data;
}

export async function createExtensionOrder(bookingId) {
  const { data } = await api.post(`/bookings/${bookingId}/extensions/razorpay/order`);
  return data;
}

export async function verifyExtensionPayment(bookingId, payload) {
  const { data } = await api.post(`/bookings/${bookingId}/extensions/razorpay/verify`, payload);
  return data?.booking || data?.data || data;
}
