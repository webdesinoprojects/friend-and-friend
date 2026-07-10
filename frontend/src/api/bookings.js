import api from "./api";

export async function createBooking(payload) {
  const { data } = await api.post("/bookings", payload);
  return data?.booking || data?.data || data;
}

export async function listBookings() {
  const { data } = await api.get("/bookings");
  return Array.isArray(data?.data) ? data.data : [];
}

export async function cancelBookingApi(bookingId, reason) {
  const { data } = await api.post(`/bookings/${bookingId}/cancel`, { reason });
  return data?.booking || data?.data || data;
}

export async function completeBookingApi(bookingId) {
  const { data } = await api.post(`/bookings/${bookingId}/complete`);
  return data?.booking || data?.data || data;
}
