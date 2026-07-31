import api from "./api";
import { getAdminPage } from "./admin";
import {
  fetchQuery,
  getQueryData,
  invalidateQueries,
} from "../utils/queryCache";

const REPORT_SUMMARY_KEY = "reports:summary";
const MY_REVIEWS_KEY = "reports:reviews";

export async function reportReview(review, reason) {
  const { data } = await api.post("/reports/reviews/report", { review, reason });
  invalidateQueries("reports:");
  return data?.data || data;
}

export async function createReview(payload) {
  const { data } = await api.post("/reports/reviews", payload, { timeout: 30000 });
  invalidateQueries("reports:");
  return data?.data || data;
}

export async function createMeetingReport(payload) {
  const { data } = await api.post("/reports/meetings", payload, { timeout: 30000 });
  invalidateQueries("reports:");
  return data;
}

export function getCachedReportSummary() {
  return getQueryData(REPORT_SUMMARY_KEY, { received: 0, limit: 10, submitted: [] });
}

export function getMyReportSummary(options = {}) {
  return fetchQuery(
    REPORT_SUMMARY_KEY,
    async () => {
      const { data } = await api.get("/reports/me");
      return data?.data || { received: 0, limit: 10, submitted: [] };
    },
    { staleTime: 60_000, ...options }
  );
}

export function getCachedMyReviews() {
  return getQueryData(MY_REVIEWS_KEY, []);
}

export function listMyReviews(options = {}) {
  return fetchQuery(
    MY_REVIEWS_KEY,
    async () => {
      const { data } = await api.get("/reports/reviews", { timeout: 30000 });
      return Array.isArray(data?.data) ? data.data : [];
    },
    { staleTime: 30_000, ...options }
  );
}

export async function listAdminReports() {
  const { data } = await getAdminPage("/admin/reports");
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
