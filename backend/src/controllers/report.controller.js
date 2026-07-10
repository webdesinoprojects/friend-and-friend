const prisma = require("../config/prisma");

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
    const review = req.body?.review || {};
    const reason = String(req.body?.reason || "").trim();

    if (!reason) {
      return res.status(400).json({ success: false, message: "Report reason is required." });
    }

    const report = await prisma.reviewReport.create({
      data: {
        reviewId: review.id ? String(review.id) : null,
        bookingId: review.bookingId ? String(review.bookingId) : null,
        reporterId: req.user.id,
        reporterRole: req.user.role,
        reporterName: req.user.fullName,
        reportedUserId: review.reviewerId || review.userId || null,
        reportedName: review.reviewerName || review.targetName || "BuddyBOOK member",
        targetRole: review.targetRole || null,
        rating: review.rating ? Number(review.rating) : null,
        reviewText: review.description || review.text || "",
        reason,
        reviewSnapshot: toJson(review),
      },
      include: { reporter: true },
    });

    return res.status(201).json({ success: true, data: serializeReport(report) });
  } catch (error) {
    console.error("CREATE_REVIEW_REPORT_ERROR:", error);
    return res.status(500).json({ success: false, message: "Could not submit report." });
  }
};

exports.listReports = async (req, res) => {
  try {
    const reports = await prisma.reviewReport.findMany({
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
