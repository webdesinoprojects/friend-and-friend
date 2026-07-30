const prisma = require("../config/prisma");
const { isAccountDisabled } = require("../utils/accountLifecycle");

const watchlistProviderSelect = {
  id: true,
  userId: true,
  headline: true,
  profession: true,
  hourlyPrice: true,
  availableCity: true,
  activities: true,
  bio: true,
  profileImages: true,
  approved: true,
  user: {
    select: {
      id: true,
      fullName: true,
      profileImage: true,
      city: true,
      state: true,
      gender: true,
      kycStatus: true,
      isBlocked: true,
      disabledUntil: true,
    },
  },
};

async function listWatchlist(req, res) {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const pageSize = Math.min(50, Math.max(1, Number.parseInt(req.query.pageSize, 10) || 24));
    const where = { userId: req.user.id };
    const [rows, total] = await Promise.all([
      prisma.providerWatchlist.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: { provider: { select: watchlistProviderSelect } },
      }),
      prisma.providerWatchlist.count({ where }),
    ]);
    const data = rows
      .map((row) => row.provider)
      .filter((provider) =>
        provider?.approved &&
        !provider.user?.isBlocked &&
        !isAccountDisabled(provider.user)
      );
    return res.json({
      success: true,
      data,
      pagination: {
        page,
        pageSize,
        total,
        pageCount: Math.max(1, Math.ceil(total / pageSize)),
        hasNextPage: page * pageSize < total,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Watch list could not be loaded." });
  }
}

async function addToWatchlist(req, res) {
  try {
    const provider = await prisma.providerProfile.findUnique({
      where: { id: req.params.providerId },
      select: { id: true, approved: true, user: { select: { isBlocked: true, disabledUntil: true } } },
    });
    if (!provider?.approved || provider.user?.isBlocked || isAccountDisabled(provider.user)) {
      return res.status(404).json({ success: false, message: "Provider profile is not available." });
    }
    await prisma.providerWatchlist.upsert({
      where: { userId_providerId: { userId: req.user.id, providerId: provider.id } },
      create: { userId: req.user.id, providerId: provider.id },
      update: {},
    });
    return res.status(201).json({ success: true, saved: true });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Provider could not be saved." });
  }
}

async function removeFromWatchlist(req, res) {
  try {
    await prisma.providerWatchlist.deleteMany({
      where: { userId: req.user.id, providerId: req.params.providerId },
    });
    return res.json({ success: true, saved: false });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Provider could not be removed." });
  }
}

async function getWatchlistStatus(req, res) {
  try {
    const item = await prisma.providerWatchlist.findUnique({
      where: { userId_providerId: { userId: req.user.id, providerId: req.params.providerId } },
      select: { id: true },
    });
    return res.json({ success: true, saved: Boolean(item) });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Watch list status could not be loaded." });
  }
}

module.exports = {
  listWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  getWatchlistStatus,
};
