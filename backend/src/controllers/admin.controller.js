const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const prisma = require("../config/prisma");
const { uploadProviderImage } = require("../utils/imagekit");
const { sendApplicationDecision } = require("../utils/email");

const contentPath = path.join(__dirname, "../../data/adminContent.json");
const defaultContent = {
  heroTitle: "Safe Meetups.",
  heroHighlight: "Real Connections.",
  heroDescription: "BuddyBOOK helps every meetup feel more secure with verified profiles, private chat, safe locations, and protected bookings.",
  heroImage: "",
  heroImageAlt: "Verified companions enjoying a public meetup",
  heroTrustItems: "KYC profiles,Public places,Private chat,Secure payments",
  heroVerifiedValue: "300+ verified",
  heroVerifiedLabel: "Growing community",
  heroLocationValue: "Public meetup",
  heroLocationLabel: "Location selected",
  communityTitle: "Built for a Better Community",
  trustTitle: "Safety and trust come first on BuddyBOOK.",
  statVerifiedMembers: "300+",
  statVerifiedMembersLabel: "Verified members",
  statPlansCreated: "1,456",
  statPlansCreatedLabel: "Plans created",
  statAverageRating: "4.8",
  statAverageRatingLabel: "Average rating",
  filterSectionTitle: "Explore more Meet - India",
  filterUsernameLabel: "Find username",
  filterLocationLabel: "Location",
  filterStateLabel: "State",
  filterActivityLabel: "Activity",
  filterSortLabel: "Sort By",
  filterPrivacyLabel: "Privacy",
  filterGenderLabel: "Gender",
  filterMaxPriceLabel: "Max price",
  filterButtonLabel: "Filter",
  filterUsernamePlaceholder: "Enter username",
  filterLocationPlaceholder: "eg. Gurgaon",
  filterStatePlaceholder: "eg. Haryana",
  filterActivityPlaceholder: "eg. Cafe meet",
  filterGenderPlaceholder: "Any gender",
  filterPricePlaceholder: "eg. Rs 1000",
  filterSortOptions: "Recently Active,Highest Ratings",
  filterGenderOptions: "All,Male,Female,Others",
  filterPriceOptions: "All,500,700,900,1200,1500,2000",
  filterResetLabel: "Reset",
  filterApplyLabel: "Apply",
  serviceTypeLabel: "Service Type",
  serviceTypePrimary: "Meet up",
  serviceTypeOptions: "City tour,Events,Cafe meet,Gaming,Dinner,Shopping,Sports",
  serviceMoreLabel: "View more services",
  providerCardPrimaryCta: "View Profile",
  providerCardBadgeText: "booked Recently",
  providerCardPriceSuffix: "/hr",
  faqTitle: "Questions, answered clearly",
  faqSubtitle: "Everything you need to know before planning a safe BuddyBOOK meetup.",
  faq1Question: "How does BuddyBOOK verify members and providers?",
  faq1Answer: "Profiles go through identity and safety checks before verification indicators are shown.",
  faq2Question: "How do payments and bookings work?",
  faq2Answer: "Choose a verified provider, select your plan details and complete the protected checkout to confirm your booking.",
  faq3Question: "Where should a first meetup happen?",
  faq3Answer: "Always choose a busy public place, keep your booking chat on BuddyBOOK and share your plan with someone you trust.",
  faq4Question: "Can I cancel or report a booking?",
  faq4Answer: "Yes. Booking controls and safety reporting remain available from your dashboard and booking history.",
  faq5Question: "How is my personal information protected?",
  faq5Answer: "BuddyBOOK keeps booking records and platform communication together so you do not need to share unnecessary personal details.",
  testimonials: [
    {
      name: "Riya Sharma",
      role: "BuddyBOOK member",
      rating: "5",
      image: "",
      text: "The booking felt clear, simple and safe from start to finish.",
    },
  ],
  testimonialsEyebrow: "What buddies say",
  testimonialsTitle: "Testimonials from real members",
  userPanelTitle: "User Workspace",
  userPanelWelcomeText: "Welcome back",
  userDashboardTitle: "Providers to Explore",
  userWatchlistTitle: "Watchlist",
  userBookingsTitle: "Bookings",
  providerPanelTitle: "Provider Workspace",
  providerDashboardTitle: "Provider Dashboard",
  providerProfileTitle: "Provider Profile",
  providerEarningsTitle: "Earnings",
  aboutUsText: "",
  termsText: "",
  privacyText: "",
  settings: {
    siteName: "BuddyBOOK",
    supportEmail: "support@buddybook.com",
    contactPhone: "+91 0000000000",
    enableNewRegistrations: true,
    maintenanceMode: false,
    emailNotifications: true,
    smsNotifications: false,
    showRatings: true,
    defaultLanguage: "English",
    currency: "INR",
  },
  updatedAt: null,
};

function getAdminEmail() {
  return process.env.ADMIN_EMAIL || "yashraj.webdesino@gmail.com";
}

function getAdminPassword() {
  return process.env.ADMIN_PASSWORD || "Rohit@15062003";
}

function readContent() {
  try {
    return {
      ...defaultContent,
      ...JSON.parse(fs.readFileSync(contentPath, "utf8")),
    };
  } catch {
    return defaultContent;
  }
}

function writeContent(content) {
  fs.mkdirSync(path.dirname(contentPath), { recursive: true });
  fs.writeFileSync(contentPath, JSON.stringify(content, null, 2));
}

const loginAdmin = (req, res) => {
  const { email, password } = req.body || {};

  if (email !== getAdminEmail() || password !== getAdminPassword()) {
    return res.status(401).json({ success: false, message: "Invalid admin credentials." });
  }

  const admin = {
    id: "admin-root",
    email: getAdminEmail(),
    role: "ADMIN",
    fullName: "Admin",
  };
  const token = jwt.sign(admin, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "30d",
  });

  return res.json({
    success: true,
    token,
    user: admin,
    admin,
    data: { token, user: admin },
  });
};

const getAdminContent = async (req, res) => {
  try {
    const rows = await prisma.$queryRawUnsafe('SELECT "content" FROM "SiteContent" WHERE "id" = $1 LIMIT 1', "website");
    return res.json({ success: true, data: { ...defaultContent, ...(rows[0]?.content || readContent()) } });
  } catch (error) {
    console.error("GET_ADMIN_CONTENT_ERROR:", error);
    return res.json({ success: true, data: readContent() });
  }
};

const updateAdminContent = async (req, res) => {
  const next = {
    ...readContent(),
    ...req.body,
    testimonials: Array.isArray(req.body?.testimonials) ? req.body.testimonials.slice(0, 15) : readContent().testimonials,
    updatedAt: new Date().toISOString(),
  };
  try {
    await prisma.$executeRawUnsafe(
      'INSERT INTO "SiteContent" ("id", "content", "updatedAt") VALUES ($1, $2::jsonb, NOW()) ON CONFLICT ("id") DO UPDATE SET "content" = EXCLUDED."content", "updatedAt" = NOW()',
      "website",
      JSON.stringify(next)
    );
    return res.json({ success: true, data: next });
  } catch (error) {
    console.error("UPDATE_ADMIN_CONTENT_ERROR:", error);
    return res.status(500).json({ success: false, message: "Content database is not ready. Run the latest Prisma migration." });
  }
};

const getAdminSummary = async (req, res) => {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const thirtyDaysAgo = new Date(today); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
    const eightWeeksAgo = new Date(today); eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 55);
    const [totalUsers, userCount, providerCount, verifiedProviders, pendingKyc, activeBookings, revenueAgg, bookings, recentReports] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "USER" } }),
      prisma.user.count({ where: { role: "PROVIDER" } }),
      prisma.providerProfile.count({ where: { approved: true } }),
      prisma.user.count({
        where: {
          OR: [{ kycStatus: { not: "VERIFIED" } }, { faceStatus: { not: "VERIFIED" } }],
        },
      }),
      prisma.booking.count({ where: { status: { in: ["CONFIRMED", "PAID", "ACCEPTED"] } } }),
      prisma.booking.aggregate({ _sum: { amount: true }, where: { paymentStatus: "PAID", createdAt: { gte: today } } }),
      prisma.booking.findMany({ where: { createdAt: { gte: eightWeeksAgo } }, include: { user: true, provider: { include: { user: true } } }, orderBy: { createdAt: "desc" } }),
      prisma.reviewReport.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    ]);

    const latestProviders = await prisma.providerProfile.findMany({
      where: { approved: true },
      select: {
        id: true,
        headline: true,
        profession: true,
        user: { select: { fullName: true, profileImage: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 4,
    });

    const bookingGrowth = Array.from({ length: 30 }, (_, index) => { const date = new Date(thirtyDaysAgo); date.setDate(date.getDate() + index); const key = date.toISOString().slice(0, 10); return { label: date.toLocaleDateString("en-IN", { day: "numeric", month: "short" }), value: bookings.filter((booking) => booking.createdAt.toISOString().slice(0, 10) === key).length }; });
    const revenueByWeek = Array.from({ length: 8 }, (_, index) => { const start = new Date(eightWeeksAgo); start.setDate(start.getDate() + index * 7); const end = new Date(start); end.setDate(end.getDate() + 7); return { label: start.toLocaleDateString("en-IN", { day: "numeric", month: "short" }), value: bookings.filter((booking) => booking.paymentStatus === "PAID" && booking.createdAt >= start && booking.createdAt < end).reduce((sum, booking) => sum + Number(booking.amount || 0), 0) }; });
    const recentActivity = bookings.slice(0, 8).map((booking) => ({ id: booking.id, date: booking.createdAt, user: booking.user?.fullName, action: "Booking created", details: `${booking.service} with ${booking.provider?.user?.fullName || "provider"}`, status: booking.status }));
    return res.json({
      success: true,
      data: {
        metrics: {
          totalUsers,
          verifiedProviders,
          activeBookings,
          revenueToday: revenueAgg._sum.amount || 0,
          pendingKyc,
          liveTotalUsers: totalUsers,
          liveVerifiedProviders: verifiedProviders,
          livePendingKyc: pendingKyc,
          userCount,
          providerCount,
        },
        charts: { bookingGrowth, revenueByWeek },
        recentActivity,
        safetyAlerts: recentReports.map((report) => ({ id: report.id, label: report.reason, status: report.status, createdAt: report.createdAt })),
        latestProviders,
        pendingApprovals: [
          { label: "KYC Verifications", count: pendingKyc },
          { label: "Provider Applications", count: await prisma.providerProfile.count({ where: { approved: false } }) },
          { label: "Content Reports", count: recentReports.filter((report) => report.status === "OPEN").length },
          { label: "Payout Requests", count: 0 },
        ],
      },
    });
  } catch (error) {
    console.error("ADMIN_SUMMARY_ERROR:", error);
    return res.status(500).json({ success: false, message: "Could not load admin dashboard data." });
  }
};

const getAdminUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { role: "USER" },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        dob: true,
        gender: true,
        role: true,
        city: true,
        state: true,
        profileImage: true,
        kycStatus: true,
        faceStatus: true,
        referenceSelfie: true,
        aadhaarLast4: true,
        mobileVerified: true,
        emailVerified: true,
        isBlocked: true,
        blockReason: true,
        disabledAt: true,
        disabledUntil: true,
        createdAt: true,
        providerProfile: {
          select: { headline: true, profession: true, approved: true, hourlyPrice: true },
        },
        userProfile: {
          select: {
            interests: true,
            preferredActivities: true,
            activityPreferences: true,
            preferredLanguage: true,
            bio: true,
            emergencyContact: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const deletedAccounts = await prisma.accountDeletionAudit.findMany({
      where: { role: "USER" },
      orderBy: { deletedAt: "desc" },
    });
    const formatted = users.map((user) => ({
      ...user,
      accountDisabled: Boolean(user.disabledUntil && new Date(user.disabledUntil) > new Date()),
      firstBooking: null,
      lastBooking: null,
      totalBookings: 0,
      totalEarning: user.role === "PROVIDER" ? 0 : null,
      totalSpending: user.role === "USER" ? 0 : null,
      bookingSummary: {
        firstBooking: null,
        lastBooking: null,
        totalBookings: 0,
        totalEarning: user.role === "PROVIDER" ? 0 : null,
        totalSpending: user.role === "USER" ? 0 : null,
      },
    }));

    const deletedRows = deletedAccounts.map((item) => ({
      id: `deleted-${item.id}`,
      originalUserId: item.originalUserId,
      fullName: "Deleted account",
      role: item.role,
      accountDeleted: true,
      deletedAt: item.deletedAt,
      bookingSummary: { totalBookings: 0, totalEarning: null, totalSpending: null },
    }));
    return res.json({ success: true, data: [...deletedRows, ...formatted] });
  } catch {
    return res.status(500).json({ success: false, message: "Failed to fetch users." });
  }
};

const getAdminUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        dob: true,
        gender: true,
        role: true,
        city: true,
        state: true,
        profileImage: true,
        kycStatus: true,
        faceStatus: true,
        referenceSelfie: true,
        aadhaarLast4: true,
        mobileVerified: true,
        emailVerified: true,
        isBlocked: true,
        blockReason: true,
        disabledAt: true,
        disabledUntil: true,
        createdAt: true,
        updatedAt: true,
        providerProfile: {
          select: {
            id: true,
            headline: true,
            profession: true,
            bio: true,
            hourlyPrice: true,
            activities: true,
            languages: true,
            education: true,
            approved: true,
            profileImages: true,
          },
        },
        userProfile: {
          select: {
            interests: true,
            preferredActivities: true,
            activityPreferences: true,
            preferredLanguage: true,
            bio: true,
            emergencyContact: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const bookings = await prisma.booking.findMany({
      where: {
        OR: [
          { userId: user.id },
          { providerUserId: user.id },
          { provider: { userId: user.id } },
        ],
      },
      include: { user: true, provider: { include: { user: true } } },
      orderBy: { createdAt: "desc" },
    });
    const sortedBookings = bookings.sort(
      (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
    );
    const userSpending = bookings
      .filter((booking) => booking.userId === user.id)
      .reduce((sum, booking) => sum + Number(booking.amount || 0), 0);
    const providerEarning = bookings
      .filter((booking) => booking.providerId === user.id)
      .reduce((sum, booking) => sum + Number(booking.amount || 0), 0);

    return res.json({
      success: true,
      data: {
        ...user,
        bookings: bookings.map(formatAdminBooking),
        bookingSummary: {
          firstBooking: sortedBookings[0]?.createdAt || null,
          lastBooking: sortedBookings[sortedBookings.length - 1]?.createdAt || null,
          totalBookings: bookings.length,
          totalEarning: providerEarning,
          totalSpending: userSpending,
        },
      },
    });
  } catch {
    return res.status(500).json({ success: false, message: "Failed to fetch user profile." });
  }
};

const getAdminProviders = async (req, res) => {
  try {
    const providers = await prisma.user.findMany({
      where: { role: "PROVIDER" },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        city: true,
        state: true,
        kycStatus: true,
        faceStatus: true,
        referenceSelfie: true,
        aadhaarLast4: true,
        profileImage: true,
        isBlocked: true,
        blockReason: true,
        disabledAt: true,
        disabledUntil: true,
        providerProfile: {
          select: { headline: true, profession: true, approved: true, hourlyPrice: true, activities: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const deletedAccounts = await prisma.accountDeletionAudit.findMany({
      where: { role: "PROVIDER" },
      orderBy: { deletedAt: "desc" },
    });
    return res.json({
      success: true,
      data: [
        ...deletedAccounts.map((item) => ({
          id: `deleted-${item.id}`,
          originalUserId: item.originalUserId,
          fullName: "Deleted account",
          role: item.role,
          accountDeleted: true,
          deletedAt: item.deletedAt,
          approved: false,
        })),
        ...providers.map((provider) => ({
        ...provider,
        accountDisabled: Boolean(provider.disabledUntil && new Date(provider.disabledUntil) > new Date()),
        headline: provider.providerProfile?.headline || provider.providerProfile?.profession || "",
        price: provider.providerProfile?.hourlyPrice || "",
        approved: Boolean(provider.providerProfile?.approved),
        activities: provider.providerProfile?.activities || "",
        })),
      ],
    });
  } catch {
    return res.status(500).json({ success: false, message: "Failed to fetch providers." });
  }
};

const getAdminBookings = async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      include: { user: true, provider: { include: { user: true } } },
      orderBy: { createdAt: "desc" },
    });
    return res.json({ success: true, data: bookings.map(formatAdminBooking) });
  } catch {
    return res.status(500).json({ success: false, message: "Failed to fetch bookings." });
  }
};

const getAdminLogins = async (req, res) => {
  try {
    const attempts = await prisma.loginAttempt.findMany({
      select: {
        id: true,
        email: true,
        message: true,
        success: true,
        faceMatched: true,
        createdAt: true,
        user: { select: { fullName: true, phone: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return res.json({ success: true, data: attempts });
  } catch {
    return res.status(500).json({ success: false, message: "Failed to fetch logins." });
  }
};

const getAdminNotifications = async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      include: { user: true, provider: { include: { user: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    const bookingRows = bookings.map((booking) => ({
      id: `booking-${booking.id}`,
      type: "booking",
      title: `Booking: ${booking.user?.fullName || "User"} with ${booking.provider?.user?.fullName || "Provider"}`,
      detail: `${booking.service} - Rs ${Number(booking.amount || 0).toLocaleString("en-IN")}`,
      createdAt: booking.createdAt,
    }));
    const logins = await prisma.loginAttempt.findMany({
      select: { id: true, email: true, success: true, message: true, createdAt: true, user: { select: { fullName: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    const loginRows = logins.map((login) => ({
      id: `login-${login.id}`,
      type: "login",
      title: `${login.success ? "Login" : "Failed login"}: ${login.user?.fullName || login.email || "Account"}`,
      detail: login.message || "Login activity",
      createdAt: login.createdAt,
    }));
    const reports = await prisma.reviewReport.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    const reportRows = reports.map((report) => ({
      id: `report-${report.id}`,
      type: "report",
      title: `Review report: ${report.reporterName || "Provider"}`,
      detail: report.reason || "A review was reported",
      createdAt: report.createdAt,
    }));
    const rows = [...bookingRows, ...loginRows, ...reportRows].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    return res.json({ success: true, data: rows });
  } catch {
    return res.json({ success: true, data: [] });
  }
};

function formatAdminBooking(booking) {
  return {
    id: booking.id,
    code: booking.code,
    userId: booking.userId,
    userName: booking.user?.fullName || "BuddyBOOK user",
    providerId: booking.providerId,
    providerUserId: booking.providerUserId,
    providerName: booking.provider?.user?.fullName || "BuddyBOOK provider",
    activity: booking.service,
    service: booking.service,
    date: booking.date,
    time: booking.time,
    durationHours: booking.durationHours,
    amount: booking.amount,
    paymentStatus: booking.paymentStatus,
    paymentMethod: booking.paymentMethod,
    status: booking.status,
    createdAt: booking.createdAt,
    updatedAt: booking.updatedAt,
  };
}

const formatPayment = (booking) => ({
  id: `payment-${booking.id}`,
  userName: booking.user?.fullName || "System",
  amount: Number(booking.amount || 0),
  type: booking.paymentMethod || "PAYMENT",
  status: (booking.paymentStatus || "COMPLETED").toLowerCase(),
  createdAt: booking.createdAt,
});

const getAdminPayments = async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: {
        paymentStatus: { not: null },
        amount: { gt: 0 },
      },
      include: { user: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const payments = bookings.map(formatPayment);
    return res.json({ success: true, data: payments });
  } catch (error) {
    console.error("GET_ADMIN_PAYMENTS_ERROR:", error);
    return res.status(500).json({ success: false, message: "Could not load payment data." });
  }
};

const uploadAdminImage = async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ success: false, message: "Select an image to upload." });
    }

    const image = await uploadProviderImage(file, 0);
    return res.json({ success: true, image });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Image upload failed.",
    });
  }
};

const blockUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body || {};

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    if (user.role === "ADMIN") {
      return res.status(403).json({ success: false, message: "Admin accounts cannot be blocked." });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isBlocked: true, blockReason: reason ? String(reason) : null },
    });

    return res.json({
      success: true,
      message: `${user.fullName} has been blocked.`,
      data: { id: updated.id, isBlocked: updated.isBlocked },
    });
  } catch {
    return res.status(500).json({ success: false, message: "Failed to block user." });
  }
};

const unblockUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isBlocked: false, blockReason: null },
    });

    return res.json({
      success: true,
      message: `${user.fullName} has been unblocked.`,
      data: { id: updated.id, isBlocked: updated.isBlocked },
    });
  } catch {
    return res.status(500).json({ success: false, message: "Failed to unblock user." });
  }
};

const getKycReviews = async (req, res) => {
  try {
    const applications = await prisma.registrationApplication.findMany({ orderBy: { updatedAt: "desc" } });
    let history = [];
    try { history = await prisma.$queryRawUnsafe('SELECT * FROM "KycReviewHistory" ORDER BY "createdAt" DESC'); } catch {}
    return res.json({ success: true, data: applications.map((item) => ({
      id: item.id, fullName: item.fullName, email: item.email, phone: item.phone, dob: item.dob,
      gender: item.gender, city: item.city, state: item.state, role: item.role,
      profileImage: item.profileImage, referenceSelfie: item.referenceSelfie,
      mobileVerified: item.mobileVerified, emailVerified: item.emailVerified,
      kycStatus: item.status, faceStatus: item.status, createdAt: item.createdAt, updatedAt: item.updatedAt,
      userProfile: item.userProfile, providerProfile: item.providerProfile,
      kycVerification: { documentType: item.documentType, documentNumber: item.documentNumber, documentNumberLast4: item.documentLast4, documentUrl: item.documentUrl, consentAccepted: item.consentAccepted, status: item.status, rejectionReason: item.rejectionReason, createdAt: item.createdAt },
      history: history.filter((entry) => entry.userId === item.id),
    })) });
  } catch (error) {
    console.error("GET_KYC_REVIEWS_ERROR:", error);
    return res.status(500).json({ success: false, message: "Could not load KYC reviews." });
  }
};

const reviewKyc = async (req, res) => {
  try {
    const status = String(req.body?.status || "").toUpperCase();
    const suppliedReason = String(req.body?.reason || "").trim();
    if (!["VERIFIED", "REJECTED", "PENDING"].includes(status)) return res.status(400).json({ success: false, message: "Invalid KYC decision." });
    if (status === "REJECTED" && !suppliedReason) return res.status(400).json({ success: false, message: "A rejection reason is required." });
    const reason = suppliedReason || (status === "VERIFIED" ? "Your submitted identity document, contact details and profile information were successfully reviewed and approved." : "Application returned to review.");
    const application = await prisma.registrationApplication.findUnique({ where: { id: req.params.userId } });
    if (!application) return res.status(404).json({ success: false, message: "Registration application not found." });

    let approvedUserId = application.approvedUserId;
    if (status === "VERIFIED" && !approvedUserId) {
      const userProfile = application.userProfile || {};
      const providerProfile = application.providerProfile || {};
      const user = await prisma.$transaction(async (tx) => {
        const existing = await tx.user.findFirst({ where: { OR: [{ email: application.email }, { phone: application.phone }] } });
        if (existing) return existing;
        return tx.user.create({ data: {
          fullName: application.fullName, email: application.email, phone: application.phone,
          passwordHash: application.passwordHash, dob: application.dob, gender: application.gender,
          city: application.city, state: application.state, role: application.role,
          mobileVerified: application.mobileVerified, emailVerified: application.emailVerified,
          kycStatus: "VERIFIED", faceStatus: "VERIFIED", profileImage: application.profileImage,
          referenceSelfie: application.referenceSelfie, aadhaarLast4: application.documentLast4,
          ageConfirmed: application.ageConfirmed, safetyAccepted: application.safetyAccepted,
          kycVerification: { create: { documentType: application.documentType, documentNumber: application.documentNumber, documentNumberLast4: application.documentLast4, documentUrl: application.documentUrl, consentAccepted: application.consentAccepted, status: "VERIFIED" } },
          userProfile: application.role === "USER" ? { create: { interests: userProfile.interests || null, preferredActivities: userProfile.preferredActivities || null, activityPreferences: userProfile.activityPreferences || null, preferredLanguage: userProfile.preferredLanguage || null, bio: userProfile.bio || null, profileQuestions: userProfile.profileQuestions || [], emergencyContact: userProfile.emergencyContact || null } } : undefined,
          providerProfile: application.role === "PROVIDER" ? { create: { headline: providerProfile.headline || providerProfile.profession || null, profession: providerProfile.profession || null, education: providerProfile.education || null, height: providerProfile.height || null, hobbies: providerProfile.hobbies || null, hourlyPrice: providerProfile.hourlyPrice || null, availableCity: providerProfile.availableCity || null, languages: providerProfile.languages || null, availabilityDays: providerProfile.availabilityDays || null, availabilitySlots: providerProfile.availabilitySlots || undefined, activities: providerProfile.activities || providerProfile.hobbies || null, bio: providerProfile.bio || null, profileImages: providerProfile.profileImages || [], profileQuestions: providerProfile.profileQuestions || [], providerSafetyAgreement: Boolean(providerProfile.providerSafetyAgreement), approved: true } } : undefined,
        } });
      });
      approvedUserId = user.id;
    }

    const updated = await prisma.registrationApplication.update({ where: { id: application.id }, data: { status, rejectionReason: status === "REJECTED" ? reason : null, decisionAt: new Date(), approvedUserId } });
    try {
      await prisma.$executeRawUnsafe('INSERT INTO "KycReviewHistory" ("id","userId","adminId","status","reason","createdAt") VALUES ($1,$2,$3,$4,$5,NOW())', crypto.randomUUID(), application.id, req.admin.id || "admin", status, reason);
    } catch {}
    let emailDelivered = true;
    let emailError = null;
    try { await sendApplicationDecision(updated, status, reason); }
    catch (error) { emailDelivered = false; emailError = error.message; console.error("KYC_DECISION_EMAIL_ERROR:", error.message); }
    return res.json({ success: true, emailDelivered, emailError, data: { id: application.id, kycStatus: status, approvedUserId }, message: emailDelivered ? `Application ${status.toLowerCase()} and email sent.` : `Application ${status.toLowerCase()}, but the email could not be sent.` });
  } catch (error) {
    console.error("REVIEW_KYC_ERROR:", error);
    return res.status(500).json({ success: false, message: "Could not save the KYC decision." });
  }
};

module.exports = {
  loginAdmin,
  getAdminContent,
  updateAdminContent,
  getAdminSummary,
  getAdminUsers,
  getAdminUserById,
  getAdminProviders,
  getAdminBookings,
  getAdminLogins,
  getAdminNotifications,
  getAdminPayments,
  uploadAdminImage,
  blockUser,
  unblockUser,
  getKycReviews,
  reviewKyc,
};
