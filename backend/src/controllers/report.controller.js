const prisma = require("../config/prisma");
const crypto = require("crypto");
const REVIEW_REASON = "__BUDDYBOOK_REVIEW__";

function serializeReport(report) {
  return {
    id: report.id,
    reviewId: report.reviewId,
    bookingId: report.bookingId,
    reporterId: report.reporterId,
    reporterRole: report.reporterRole,
    reporterName: report.reporterName || report.reporter?.fullName || "",
    reportedUserId: report.reportedUserId,
    reportedName: report.reportedName,
    targetRole: report.targetRole,
    rating: report.rating,
    reviewText: report.reviewText,
    reason: report.reason,
    status: report.status,
    adminAction: report.adminAction,
    adminNote: report.adminNote,
    reviewSnapshot: report.reviewSnapshot,
    createdAt: report.createdAt,
    updatedAt: report.updatedAt,
  };
}

function toJson(value) {
  return JSON.parse(JSON.stringify(value || {}));
}

exports.createReviewReport = async (req, res) => {
  try {
    const suppliedReview = req.body?.review || {};
    const reason = String(req.body?.reason || "").trim();

    if (!reason) {
      return res.status(400).json({ success: false, message: "Report reason is required." });
    }

    const storedReview = suppliedReview.id ? await prisma.reviewReport.findFirst({
      where: { reviewId: String(suppliedReview.id), reason: REVIEW_REASON, adminAction: null },
    }) : null;
    if (!storedReview || storedReview.reportedUserId !== req.user.id) {
      return res.status(404).json({ success: false, message: "Review not found or cannot be reported by this account." });
    }
    const snapshot = storedReview.reviewSnapshot || {};
    const report = await prisma.reviewReport.create({
      data: {
        reviewId: storedReview.reviewId,
        bookingId: storedReview.bookingId,
        reporterId: req.user.id,
        reporterRole: req.user.role,
        reporterName: req.user.fullName,
        reportedUserId: storedReview.reporterId,
        reportedName: storedReview.reporterName || snapshot.reviewerName || "BuddyBOOK member",
        targetRole: storedReview.reporterRole,
        rating: storedReview.rating,
        reviewText: storedReview.reviewText,
        reason,
        reviewSnapshot: toJson(snapshot),
      },
      include: { reporter: true },
    });

    return res.status(201).json({ success: true, data: serializeReport(report) });
  } catch (error) {
    console.error("CREATE_REVIEW_REPORT_ERROR:", error);
    return res.status(500).json({ success: false, message: "Could not submit report." });
  }
};

exports.createReview = async (req, res) => {
  try {
    const bookingId = String(req.body?.bookingId || "");
    const rating = Number(req.body?.rating);
    const description = String(req.body?.description || "").trim();
    if (!bookingId || !Number.isInteger(rating) || rating < 1 || rating > 5 || !description) {
      return res.status(400).json({ success: false, message: "Booking, rating from 1 to 5 and review text are required." });
    }
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { user: true, provider: { include: { user: true } } },
    });
    if (!booking || String(booking.status).toUpperCase() !== "COMPLETED") {
      return res.status(400).json({ success: false, message: "Reviews are available only after a completed booking." });
    }
    const isUser = booking.userId === req.user.id;
    const isProvider = booking.providerUserId === req.user.id;
    if (!isUser && !isProvider) return res.status(403).json({ success: false, message: "You are not part of this booking." });
    const existing = await prisma.reviewReport.findFirst({
      where: { bookingId, reporterId: req.user.id, reason: REVIEW_REASON },
    });
    if (existing) return res.status(409).json({ success: false, message: "You already reviewed this booking." });
    const target = isUser ? booking.provider.user : booking.user;
    const reviewId = crypto.randomUUID();
    const review = await prisma.reviewReport.create({
      data: {
        reviewId,
        bookingId,
        reporterId: req.user.id,
        reporterRole: isUser ? "USER" : "PROVIDER",
        reporterName: req.user.fullName,
        reportedUserId: target.id,
        reportedName: target.fullName,
        targetRole: isUser ? "PROVIDER" : "USER",
        rating,
        reviewText: description,
        reason: REVIEW_REASON,
        status: "PUBLISHED",
        reviewSnapshot: { id: reviewId, bookingId, reviewerId: req.user.id, reviewerName: req.user.fullName, reviewerRole: isUser ? "USER" : "PROVIDER", targetRole: isUser ? "PROVIDER" : "USER", targetName: target.fullName, rating, description, service: booking.service },
      },
    });
    return res.status(201).json({ success: true, data: serializeStoredReview(review) });
  } catch (error) {
    console.error("CREATE_REVIEW_ERROR:", error);
    return res.status(500).json({ success: false, message: "Could not submit review." });
  }
};

exports.listMyReviews = async (req, res) => {
  try {
    const rows = await prisma.reviewReport.findMany({
      where: { reason: REVIEW_REASON, adminAction: null, OR: [{ reporterId: req.user.id }, { reportedUserId: req.user.id }] },
      orderBy: { createdAt: "desc" },
    });
    return res.json({ success: true, data: rows.map(serializeStoredReview) });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Could not load reviews." });
  }
};

function serializeStoredReview(row) {
  return { ...(row.reviewSnapshot || {}), id: row.reviewId, bookingId: row.bookingId, reviewerId: row.reporterId, reviewerRole: row.reporterRole, reviewerName: row.reporterName, targetRole: row.targetRole, targetName: row.reportedName, rating: row.rating, description: row.reviewText, createdAt: row.createdAt };
}

exports.listReports = async (req, res) => {
  try {
    const reports = await prisma.reviewReport.findMany({
      where: { reason: { not: REVIEW_REASON } },
      include: { reporter: true },
      orderBy: { createdAt: "desc" },
    });
    return res.json({ success: true, data: reports.map(serializeReport) });
  } catch (error) {
    console.error("LIST_REPORTS_ERROR:", error);
    return res.status(500).json({ success: false, message: "Could not load reports." });
  }
};

exports.updateReportAction = async (req, res) => {
  try {
    const { status = "RESOLVED", adminAction = "", adminNote = "" } = req.body || {};
    const current = await prisma.reviewReport.findUnique({ where: { id: req.params.id } });
    if (!current || current.reason === REVIEW_REASON) return res.status(404).json({ success: false, message: "Report not found." });
    if (adminAction === "DELETE_REVIEW" && current.reviewId) {
      await prisma.reviewReport.updateMany({ where: { reviewId: current.reviewId, reason: REVIEW_REASON }, data: { adminAction: "DELETED_BY_ADMIN", status: "REMOVED" } });
    }
    if (adminAction === "BLOCK_REPORTED_ACCOUNT" && current.reportedUserId) {
      await prisma.user.update({ where: { id: current.reportedUserId }, data: { isBlocked: true, blockReason: adminNote || "Blocked after review report" } });
    }
    const report = await prisma.reviewReport.update({
      where: { id: req.params.id },
      data: {
        status: String(status || "RESOLVED").toUpperCase(),
        adminAction: String(adminAction || "").trim() || null,
        adminNote: String(adminNote || "").trim() || null,
      },
      include: { reporter: true },
    });
    return res.json({ success: true, data: serializeReport(report) });
  } catch (error) {
    console.error("UPDATE_REPORT_ERROR:", error);
    return res.status(500).json({ success: false, message: "Could not update report." });
  }
};

exports.deleteReport = async (req, res) => {
  try {
    await prisma.reviewReport.delete({ where: { id: req.params.id } });
    return res.json({ success: true, data: { id: req.params.id } });
  } catch (error) {
    console.error("DELETE_REPORT_ERROR:", error);
    return res.status(500).json({ success: false, message: "Could not delete report." });
  }
};
