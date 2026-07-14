import api from "./api";

export async function reportReview(review, reason) {
  const { data } = await api.post("/reports/reviews/report", { review, reason });
  return data?.data || data;
}

export async function createReview(payload) {
  const { data } = await api.post("/reports/reviews", payload, { timeout: 30000 });
  return data?.data || data;
}

export async function listMyReviews() {
  const { data } = await api.get("/reports/reviews", { timeout: 30000 });
  return Array.isArray(data?.data) ? data.data : [];
}

export async function listAdminReports() {
  const { data } = await api.get("/admin/reports");
  return Array.isArray(data?.data) ? data.data : [];
}

export async function updateAdminReport(reportId, payload) {
  const { data } = await api.patch(`/admin/reports/${reportId}`, payload);
  return data?.data || data;
}

export async function deleteAdminReport(reportId) {
  const { data } = await api.delete(`/admin/reports/${reportId}`);
  return data?.data || data;
}
