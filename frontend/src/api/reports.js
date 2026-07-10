import api from "./api";

export async function reportReview(review, reason) {
  const { data } = await api.post("/reports/reviews", { review, reason });
  return data?.data || data;
}

export async function listAdminReports() {
  const { data } = await api.get("/admin/reports");
  return Array.isArray(data?.data) ? data.data : [];
}

export async function updateAdminReport(reportId, payload) {
  const { data } = await api.patch(`/admin/reports/${reportId}`, payload);
  return data?.data || data;
}
