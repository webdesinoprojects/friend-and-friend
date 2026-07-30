const prisma = require("../config/prisma");
const { parsePagination, paginationMeta } = require("../utils/pagination");
const { clearProviderListCache } = require("./provider.controller");
const crypto = require("crypto");
const { sendTransactionalEmail } = require("../utils/email");
const REVIEW_REASON = "__BUDDYBOOK_REVIEW__";
const REPORT_LIMIT = 10;
const MEETING_REPORT_REASONS = new Set([
  "ABUSE_OR_THREATS",
  "SEXUAL_HARASSMENT",
  "PHYSICAL_SAFETY",
  "FRAUD_OR_THEFT",
  "DISCRIMINATION_OR_HATE",
]);

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

exports.createMeetingReport = async (req, res) => {
  try {
    const bookingId = String(req.body?.bookingId || "").trim();
    const reason = String(req.body?.reason || "").trim().toUpperCase();
    const details = String(req.body?.details || "").trim();
    if (!bookingId || !MEETING_REPORT_REASONS.has(reason) || details.length < 10 || details.length > 2000) {
      return res.status(400).json({ success: false, message: "Choose a report reason and provide 10 to 2,000 characters of details." });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { user: true, provider: { include: { user: true } } },
    });
    if (!booking || String(booking.status).toUpperCase() !== "COMPLETED") {
      return res.status(400).json({ success: false, message: "A report can be submitted only after a completed meeting." });
    }
    const reporterIsUser = booking.userId === req.user.id;
    const reporterIsProvider = booking.providerUserId === req.user.id;
    if (!reporterIsUser && !reporterIsProvider) {
      return res.status(403).json({ success: false, message: "You are not part of this meeting." });
    }
    const target = reporterIsUser ? booking.provider.user : booking.user;
    const duplicate = await prisma.reviewReport.findFirst({
      where: { bookingId, reporterId: req.user.id, reviewId: null, reason: { not: REVIEW_REASON } },
    });
    if (duplicate) return res.status(409).json({ success: false, message: "You already reported this meeting." });

    const report = await prisma.reviewReport.create({
      data: {
        bookingId,
        reporterId: req.user.id,
        reporterRole: reporterIsUser ? "USER" : "PROVIDER",
        reporterName: req.user.fullName,
        reportedUserId: target.id,
        reportedName: target.fullName,
        targetRole: reporterIsUser ? "PROVIDER" : "USER",
        reason,
        reviewText: details,
        reviewSnapshot: {
          type: "MEETING_REPORT",
          meetingCode: booking.code,
          service: booking.service,
          meetingDate: booking.date,
          meetingTime: booking.time,
          meetingEndedAt: booking.meetingEndedAt,
        },
      },
      include: { reporter: true },
    });
    const reportCount = await prisma.reviewReport.count({
      where: { reportedUserId: target.id, reason: { not: REVIEW_REASON } },
    });
    let permanentlyBanned = false;
    let emailDelivered = null;
    if (reportCount >= REPORT_LIMIT && !target.isBlocked) {
      permanentlyBanned = true;
      await prisma.user.update({
        where: { id: target.id },
        data: { isBlocked: true, blockReason: `Permanently banned after receiving ${REPORT_LIMIT} meeting reports.` },
      });
      if (target.email) {
        try {
          await sendTransactionalEmail({
            to: target.email,
            subject: "Your BuddyBOOK account has been permanently banned",
            text: `Hi ${target.fullName}, your BuddyBOOK account has been permanently banned after receiving 10 meeting reports. You can no longer access or use BuddyBOOK.`,
            html: `<p>Hi <strong>${target.fullName}</strong>,</p><p>Your BuddyBOOK account has been <strong>permanently banned</strong> after receiving 10 meeting reports. You can no longer access or use BuddyBOOK.</p>`,
            tag: "report_limit_ban",
          });
          emailDelivered = true;
        } catch (error) {
          emailDelivered = false;
          console.error("REPORT_LIMIT_EMAIL_ERROR:", error.message);
        }
      }
    }
    return res.status(201).json({ success: true, data: serializeReport(report), reportCount, permanentlyBanned, emailDelivered });
  } catch (error) {
    console.error("CREATE_MEETING_REPORT_ERROR:", error);
    return res.status(500).json({ success: false, message: "Could not submit the meeting report." });
  }
};

exports.getMyReportSummary = async (req, res) => {
  try {
    const [received, submitted] = await Promise.all([
      prisma.reviewReport.count({ where: { reportedUserId: req.user.id, reason: { not: REVIEW_REASON } } }),
      prisma.reviewReport.findMany({
        where: { reporterId: req.user.id, reason: { not: REVIEW_REASON } },
        select: { id: true, bookingId: true, reportedName: true, targetRole: true, reason: true, reviewText: true, status: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      }),
    ]);
    return res.json({ success: true, data: { received, limit: REPORT_LIMIT, submitted } });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Could not load report information." });
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
    clearProviderListCache();
    return res.status(201).json({ success: true, data: serializeStoredReview(review) });
  } catch (error) {
    console.error("CREATE_REVIEW_ERROR:", error);
    return res.status(500).json({ success: false, message: "Could not submit review." });
  }
};

exports.listMyReviews = async (req, res) => {
  try {
    const where = { reason: REVIEW_REASON, adminAction: null, OR: [{ reporterId: req.user.id }, { reportedUserId: req.user.id }] };
    const pagination = parsePagination(req.query, { defaultPageSize: 50 });
    const [rows, total] = await Promise.all([
      prisma.reviewReport.findMany({ where, orderBy: { createdAt: "desc" }, skip: pagination.skip, take: pagination.take }),
      prisma.reviewReport.count({ where }),
    ]);
    return res.json({ success: true, data: rows.map(serializeStoredReview), pagination: paginationMeta({ ...pagination, total }) });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Could not load reviews." });
  }
};

function serializeStoredReview(row) {
  return { ...(row.reviewSnapshot || {}), id: row.reviewId, bookingId: row.bookingId, reviewerId: row.reporterId, reviewerRole: row.reporterRole, reviewerName: row.reviewerName, targetRole: row.targetRole, targetId: row.reportedUserId, targetName: row.reportedName, rating: row.rating, description: row.reviewText, createdAt: row.createdAt };
}

exports.listReports = async (req, res) => {
  try {
    const where = { reason: { not: REVIEW_REASON } };
    const pagination = parsePagination(req.query, { defaultPageSize: 50 });
    const [reports, total] = await Promise.all([
      prisma.reviewReport.findMany({
        where,
        include: { reporter: true },
        orderBy: { createdAt: "desc" },
        skip: pagination.skip,
        take: pagination.take,
      }),
      prisma.reviewReport.count({ where }),
    ]);
    return res.json({ success: true, data: reports.map(serializeReport), pagination: paginationMeta({ ...pagination, total }) });
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
    clearProviderListCache();
    return res.json({ success: true, data: serializeReport(report) });
  } catch (error) {
    console.error("UPDATE_REPORT_ERROR:", error);
    return res.status(500).json({ success: false, message: "Could not update report." });
  }
};

exports.deleteReport = async (req, res) => {
  try {
    await prisma.reviewReport.delete({ where: { id: req.params.id } });
    clearProviderListCache();
    return res.json({ success: true, data: { id: req.params.id } });
  } catch (error) {
    console.error("DELETE_REPORT_ERROR:", error);
    return res.status(500).json({ success: false, message: "Could not delete report." });
  }
};
