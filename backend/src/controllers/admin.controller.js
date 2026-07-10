const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");
const { uploadProviderImage } = require("../utils/imagekit");

const contentPath = path.join(__dirname, "../../data/adminContent.json");
const defaultContent = {
  heroTitle: "Safe Meetups. Real Connections.",
  heroHighlight: "Find trusted people. Book with confidence.",
  heroImage: "",
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
  providerCardPrimaryCta: "View Profile",
  providerCardBadgeText: "booked Recently",
  providerCardPriceSuffix: "/hr",
  testimonials: [
    {
      name: "Riya Sharma",
      role: "BuddyBOOK member",
      rating: "5",
      image: "",
      text: "The booking felt clear, simple and safe from start to finish.",
    },
  ],
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

const getAdminContent = (req, res) => {
  return res.json({ success: true, data: readContent() });
};

const updateAdminContent = (req, res) => {
  const next = {
    ...readContent(),
    ...req.body,
    updatedAt: new Date().toISOString(),
  };

  writeContent(next);
  return res.json({ success: true, data: next });
};

const getAdminSummary = async (req, res) => {
  try {
    const [totalUsers, verifiedProviders, pendingKyc, activeBookings, revenueAgg] = await Promise.all([
      prisma.user.count(),
      prisma.providerProfile.count({ where: { approved: true } }),
      prisma.user.count({
        where: {
          OR: [{ kycStatus: { not: "VERIFIED" } }, { faceStatus: { not: "VERIFIED" } }],
        },
      }),
      prisma.booking.count({ where: { status: { in: ["CONFIRMED", "PAID", "ACCEPTED"] } } }),
      prisma.booking.aggregate({ _sum: { amount: true }, where: { paymentStatus: "PAID" } }),
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
        },
        latestProviders,
        pendingApprovals: [
          { label: "KYC Verifications", count: pendingKyc },
          { label: "Provider Applications", count: await prisma.providerProfile.count({ where: { approved: false } }) },
          { label: "Content Reports", count: 0 },
          { label: "Payout Requests", count: 0 },
        ],
      },
    });
  } catch {
    return res.json({
      success: true,
      data: {
        metrics: {
          totalUsers: 12458,
          verifiedProviders: 1245,
          activeBookings: 382,
          revenueToday: 8742,
          pendingKyc: 37,
        },
        latestProviders: [],
        pendingApprovals: [
          { label: "KYC Verifications", count: 37 },
          { label: "Provider Applications", count: 12 },
          { label: "Content Reports", count: 5 },
          { label: "Payout Requests", count: 8 },
        ],
      },
    });
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

    const formatted = users.map((user) => ({
      ...user,
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

    return res.json({ success: true, data: formatted });
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
        providerProfile: {
          select: { headline: true, profession: true, approved: true, hourlyPrice: true, activities: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json({
      success: true,
      data: providers.map((provider) => ({
        ...provider,
        headline: provider.providerProfile?.headline || provider.providerProfile?.profession || "",
        price: provider.providerProfile?.hourlyPrice || "",
        approved: Boolean(provider.providerProfile?.approved),
        activities: provider.providerProfile?.activities || "",
      })),
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
    const rows = [...bookingRows, ...loginRows].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
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

const getAdminPayments = async (req, res) => {
  return res.json({ success: true, data: [] });
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
};
