const prisma = require('../config/prisma');
const {
  normalizeStoredImage,
  uploadProviderImage,
  uploadProviderBase64Image,
} = require('../utils/imagekit');
const { isAccountDisabled } = require('../utils/accountLifecycle');
const TimedCache = require('../utils/timedCache');
const REVIEW_REASON = '__BUDDYBOOK_REVIEW__';
const PUBLIC_CACHE_MS = 60 * 1000;
const providerListCache = new TimedCache({ ttlMs: PUBLIC_CACHE_MS, maxEntries: 200 });
const providerDetailCache = new TimedCache({ ttlMs: PUBLIC_CACHE_MS, maxEntries: 500 });
const providerRatingCache = new TimedCache({ ttlMs: PUBLIC_CACHE_MS, maxEntries: 500 });

async function calculateProviderRating(userId) {
  const cached = providerRatingCache.get(userId);
  if (cached) return cached;

  const reports = await prisma.reviewReport.findMany({
    where: {
      targetRole: 'PROVIDER',
      reportedUserId: userId,
      rating: { not: null },
      reason: '__BUDDYBOOK_REVIEW__',
      adminAction: null,
    },
    select: { rating: true },
  });

  if (!reports.length) {
    const empty = { rating: 0, reviewCount: 0 };
    providerRatingCache.set(userId, empty);
    return empty;
  }

  const sum = reports.reduce((acc, report) => acc + Number(report.rating || 0), 0);
  const rating = {
    rating: Number((sum / reports.length).toFixed(2)),
    reviewCount: reports.length,
  };
  providerRatingCache.set(userId, rating);
  return rating;
}

const includeUser = { user: true };
const cardUserSelect = {
  id: true,
  fullName: true,
  email: true,
  phone: true,
  profileImage: true,
  city: true,
  state: true,
  gender: true,
  role: true,
  mobileVerified: true,
  emailVerified: true,
  kycStatus: true,
  faceStatus: true,
  isBlocked: true,
  disabledUntil: true,
};
const cardProviderSelect = {
  id: true,
  userId: true,
  headline: true,
  profession: true,
  education: true,
  height: true,
  hobbies: true,
  hourlyPrice: true,
  availableCity: true,
  languages: true,
  availabilityDays: true,
  availabilitySlots: true,
  activities: true,
  bio: true,
  profileImages: true,
  profileQuestions: true,
  providerSafetyAgreement: true,
  approved: true,
  createdAt: true,
  updatedAt: true,
  user: { select: cardUserSelect },
};
const cardProviderListSelect = {
  id: true,
  userId: true,
  headline: true,
  profession: true,
  education: true,
  height: true,
  hobbies: true,
  hourlyPrice: true,
  availableCity: true,
  languages: true,
  availabilityDays: true,
  availabilitySlots: true,
  activities: true,
  bio: true,
  profileQuestions: true,
  providerSafetyAgreement: true,
  approved: true,
  createdAt: true,
  updatedAt: true,
  user: { select: cardUserSelect },
};

function withImageMode(provider, imageMode = 'none') {
  if (!provider) return provider;
  if (imageMode === 'all') return provider;

  const images = Array.isArray(provider.profileImages) ? provider.profileImages : [];
  const normalizedImages = images.map(normalizeStoredImage).filter(Boolean);

  return {
    ...provider,
    profileImages: imageMode === 'first' ? normalizedImages.slice(0, 1) : [],
    imageCount: normalizedImages.length || provider.imageCount || 0,
  };
}

function sanitizeProviderImages(provider) {
  if (!provider) return provider;
  return {
    ...provider,
    profileImages: normalizeProfileImages(provider.profileImages),
  };
}

function getCacheKey({ where, page, pageSize, imageMode }) {
  return JSON.stringify({ where, page, pageSize, imageMode });
}

function getCachedList(key) {
  return providerListCache.get(key) || null;
}

function setCachedList(key, data) {
  providerListCache.set(key, data);
}

function clearProviderListCache() {
  providerListCache.clear();
  providerDetailCache.clear();
  providerRatingCache.clear();
}

async function fetchProviderList({ where, page, pageSize, imageMode }) {
  const cacheKey = getCacheKey({ where, page, pageSize, imageMode });
  const cached = getCachedList(cacheKey);
  if (cached) return cached;

  const [providers, total] = await Promise.all([
    prisma.providerProfile.findMany({
      where,
      select: imageMode === 'none' ? cardProviderListSelect : cardProviderSelect,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.providerProfile.count({ where }),
  ]);

  const cleaned = providers.filter(
    (provider) => !provider.user?.isBlocked && !isAccountDisabled(provider.user)
  );

  const ratingMap = await loadProviderRatings(
    cleaned.map((provider) => provider.user?.id).filter(Boolean)
  );

  const data = cleaned.map((provider) => {
    const stats = ratingMap[provider.user?.id];
    const withRating = stats
      ? { ...provider, rating: stats.rating, reviewCount: stats.reviewCount }
      : provider;
    return withImageMode(withRating, imageMode);
  });
  const result = {
    data,
    pagination: {
      page,
      pageSize,
      total,
      pageCount: Math.max(1, Math.ceil(total / pageSize)),
      hasNextPage: page * pageSize < total,
    },
  };
  setCachedList(cacheKey, result);
  return result;
}

async function loadProviderRatings(userIds) {
  const ratingMap = {};
  if (!userIds.length) return ratingMap;

  const reports = await prisma.reviewReport.findMany({
    where: {
      targetRole: 'PROVIDER',
      reportedUserId: { in: userIds },
      rating: { not: null },
      reason: REVIEW_REASON,
      adminAction: null,
    },
    select: { reportedUserId: true, rating: true },
  });

  const sums = {};
  reports.forEach((report) => {
    const id = report.reportedUserId;
    if (!sums[id]) sums[id] = { total: 0, count: 0 };
    sums[id].total += Number(report.rating) || 0;
    sums[id].count += 1;
  });

  Object.keys(sums).forEach((id) => {
    ratingMap[id] = {
      rating: sums[id].count ? sums[id].total / sums[id].count : 0,
      reviewCount: sums[id].count,
    };
  });

  return ratingMap;
}

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : value;
}

function normalizeProfileImages(images) {
  if (!Array.isArray(images)) return [];
  return images
    .map(normalizeStoredImage)
    .filter(Boolean);
}

function buildProfileData(body, { requireImages = false } = {}) {
  const hasBase64Image = Array.isArray(body.profileImages)
    ? body.profileImages.some((image) =>
        typeof image === 'string'
          ? image.startsWith('data:image/')
          : String(image?.url || '').startsWith('data:image/')
      )
    : false;

  if (hasBase64Image) {
    const error = new Error('Upload provider images first. Base64 images cannot be saved.');
    error.statusCode = 400;
    throw error;
  }

  const profileImages = normalizeProfileImages(body.profileImages);
  const hourlyPrice = normalizeText(body.hourlyPrice);

  if (requireImages && profileImages.length !== 4) {
    const error = new Error('Exactly 4 provider images are required.');
    error.statusCode = 400;
    throw error;
  }

  if (hourlyPrice && Number(hourlyPrice) < 500) {
    const error = new Error('Hourly price must be Rs 500 or more.');
    error.statusCode = 400;
    throw error;
  }

  return {
    headline: normalizeText(body.headline) || null,
    profession: normalizeText(body.profession) || null,
    education: normalizeText(body.education) || null,
    height: normalizeText(body.height) || null,
    hobbies: normalizeText(body.hobbies) || null,
    hourlyPrice: hourlyPrice || null,
    availableCity: normalizeText(body.availableCity) || null,
    languages: normalizeText(body.languages) || null,
    availabilityDays: normalizeText(body.availabilityDays) || null,
    availabilitySlots: Array.isArray(body.availabilitySlots) ? body.availabilitySlots.filter((slot) => slot?.date && slot?.time) : [],
    activities: normalizeText(body.activities) || normalizeText(body.hobbies) || null,
    bio: normalizeText(body.bio) || null,
    profileImages,
    profileQuestions: Array.isArray(body.profileQuestions) ? body.profileQuestions : [],
    providerSafetyAgreement: Boolean(body.providerSafetyAgreement),
    approved: Boolean(body.approved),
  };
}

async function loadPublicProviderReviews(userId, take = 20) {
  const rows = await prisma.reviewReport.findMany({
    where: {
      targetRole: 'PROVIDER',
      reportedUserId: userId,
      rating: { not: null },
      reason: REVIEW_REASON,
      adminAction: null,
    },
    include: {
      reporter: { select: { profileImage: true } },
    },
    orderBy: { createdAt: 'desc' },
    take,
  });

  return rows.map((row) => {
    const snapshot = row.reviewSnapshot && typeof row.reviewSnapshot === 'object'
      ? row.reviewSnapshot
      : {};
    return {
      ...snapshot,
      id: row.reviewId || row.id,
      bookingId: row.bookingId,
      reviewerId: row.reporterId,
      reviewerName: row.reporterName || snapshot.reviewerName || 'BuddyBOOK user',
      reviewerImage: row.reporter?.profileImage || snapshot.reviewerImage || '',
      rating: Number(row.rating || snapshot.rating || 0),
      description: row.reviewText || snapshot.description || '',
      service: snapshot.service || 'Public meetup',
      createdAt: row.createdAt,
    };
  });
}

function ratingFromReviews(reviews) {
  if (!reviews.length) return { rating: 0, reviewCount: 0 };
  return {
    rating: Number(
      (reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length).toFixed(2)
    ),
    reviewCount: reviews.length,
  };
}

function buildStats(provider) {
  const price = Number(provider?.hourlyPrice || 0);
  const images = Array.isArray(provider?.profileImages) ? provider.profileImages : [];
  const completedFields = [
    provider?.headline,
    provider?.profession,
    provider?.hourlyPrice,
    provider?.availableCity,
    provider?.languages,
    provider?.availabilityDays,
    provider?.activities,
    provider?.bio,
    provider?.providerSafetyAgreement,
    images.length === 4,
  ].filter(Boolean).length;

  const profileCompletion = Math.round((completedFields / 10) * 100);
  const weeklyViews = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((name) => ({
    name,
    views: 0,
    bookings: 0,
    revenue: 0,
  }));

  return {
    profileCompletion,
    totalViews: 0,
    totalBookings: 0,
    totalRevenue: 0,
    pendingRequests: 0,
    rating: 0,
    reviewCount: 0,
    weeklyViews,
  };
}

const createProvider = async (req, res) => {
  try {
    if (req.user.role !== 'PROVIDER') {
      return res.status(403).json({ success: false, message: 'Only provider accounts can create provider profiles.' });
    }
    const userId = req.user.id;

    const data = buildProfileData(req.body, { requireImages: true });

    const provider = await prisma.providerProfile.create({
      data: {
        user: { connect: { id: userId } },
        ...data,
        approved: true,
      },
      include: includeUser,
    });
    clearProviderListCache();

    return res.status(201).json({ success: true, data: sanitizeProviderImages(provider) });
  } catch (err) {
    console.error('createProvider error', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const listProviders = async (req, res) => {
  try {
    // Support both `approved` and legacy `verified` query param from frontend
    const { approved, verified, limit, imageMode = 'none' } = req.query;
    const cacheMinute = new Date(Math.floor(Date.now() / PUBLIC_CACHE_MS) * PUBLIC_CACHE_MS);
    const where = {
      user: {
        isBlocked: false,
        OR: [{ disabledUntil: null }, { disabledUntil: { lte: cacheMinute } }],
      },
    };
    const approvalFlag = approved !== undefined ? approved : verified;
    if (approvalFlag !== undefined) where.approved = String(approvalFlag) === 'true';

    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, Number.parseInt(limit || req.query.pageSize, 10) || 24));
    const result = await fetchProviderList({ where, page, pageSize, imageMode });
    res.set('Cache-Control', 'public, max-age=30, s-maxage=60, stale-while-revalidate=300');
    return res.json({ success: true, data: result.data, pagination: result.pagination });
  } catch (err) {
    console.error('listProviders error', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getProvider = async (req, res) => {
  try {
    const { id } = req.params;
    const cached = providerDetailCache.get(id);
    if (cached) {
      res.set('Cache-Control', 'public, max-age=30, s-maxage=60, stale-while-revalidate=300');
      return res.json({ success: true, data: cached });
    }
    const provider = await prisma.providerProfile.findUnique({
      where: { id },
      select: cardProviderSelect,
    });
    if (!provider || provider.user?.isBlocked || isAccountDisabled(provider.user)) {
      return res.status(404).json({ success: false, message: 'Provider profile is not available.' });
    }
    const reviews = await loadPublicProviderReviews(provider.userId);
    const rating = ratingFromReviews(reviews);
    providerRatingCache.set(provider.userId, rating);
    const data = {
      ...sanitizeProviderImages(provider),
      rating: rating.rating,
      reviewCount: rating.reviewCount,
      reviews,
    };
    providerDetailCache.set(id, data);
    res.set('Cache-Control', 'public, max-age=30, s-maxage=60, stale-while-revalidate=300');
    return res.json({
      success: true,
      data,
    });
  } catch (err) {
    console.error('getProvider error', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const uploadProviderImages = async (req, res) => {
  try {
    const files = Array.isArray(req.files) ? req.files : [];

    const base64Images = Array.isArray(req.body?.images) ? req.body.images : [];

    if (!files.length && !base64Images.length) {
      return res.status(400).json({
        success: false,
        message: 'Select at least one image to upload.',
      });
    }

    const fileUploads = files
      .slice(0, 4)
      .map((file, index) => uploadProviderImage(file, index));
    const base64Uploads = base64Images
      .slice(0, Math.max(0, 4 - fileUploads.length))
      .map((image, index) => uploadProviderBase64Image(image, index + files.length));
    const images = await Promise.all([...fileUploads, ...base64Uploads]);

    return res.json({
      success: true,
      images,
    });
  } catch (err) {
    console.error('uploadProviderImages error', err);
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || 'Image upload failed.',
    });
  }
};

const updateMyProfilePhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Select a profile photo.' });
    }

    const image = await uploadProviderImage(req.file, 0);
    const current = await prisma.providerProfile.findUnique({
      where: { userId: req.user.id },
      select: { profileImages: true },
    });
    if (!current) {
      return res.status(404).json({ success: false, message: 'Provider profile was not found.' });
    }

    const previousImages = normalizeProfileImages(current.profileImages);
    const profileImages = [image, ...previousImages.slice(1, 4)];
    const [, provider] = await prisma.$transaction([
      prisma.user.update({ where: { id: req.user.id }, data: { profileImage: image.url } }),
      prisma.providerProfile.update({
        where: { userId: req.user.id },
        data: { profileImages },
        include: includeUser,
      }),
    ]);
    clearProviderListCache();

    return res.json({
      success: true,
      message: 'Public profile photo updated.',
      image,
      data: sanitizeProviderImages(provider),
    });
  } catch (err) {
    console.error('updateMyProfilePhoto error', err);
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || 'Profile photo could not be updated.',
    });
  }
};

const getProviderImages = async (req, res) => {
  try {
    const { id } = req.params;
    const provider = await prisma.providerProfile.findUnique({
      where: { id },
      select: { id: true, profileImages: true, user: { select: { isBlocked: true, disabledUntil: true } } },
    });

    if (!provider || provider.user?.isBlocked || isAccountDisabled(provider.user)) {
      return res.status(404).json({ success: false, message: 'Provider profile is not available.' });
    }

    const images = normalizeProfileImages(provider.profileImages);

    res.set('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600');
    return res.json({
      success: true,
      images,
    });
  } catch (err) {
    console.error('getProviderImages error', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getMyProvider = async (req, res) => {
  try {
    const provider = await prisma.providerProfile.findUnique({
      where: { userId: req.user.id },
      include: includeUser,
    });

    const rating = await calculateProviderRating(req.user.id);

    return res.json({
      success: true,
      data: { ...sanitizeProviderImages(provider), rating: rating.rating, reviewCount: rating.reviewCount },
      stats: buildStats(provider),
    });
  } catch (err) {
    console.error('getMyProvider error', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const upsertMyProvider = async (req, res) => {
  try {
    const data = buildProfileData(req.body, { requireImages: true });

    const provider = await prisma.providerProfile.upsert({
      where: { userId: req.user.id },
      create: {
        user: { connect: { id: req.user.id } },
        ...data,
        approved: true,
      },
      update: {
        ...data,
        approved: true,
      },
      include: includeUser,
    });
    clearProviderListCache();

    if (req.user.role !== 'PROVIDER') {
      await prisma.user.update({
        where: { id: req.user.id },
        data: { role: 'PROVIDER' },
      });
    }

    const rating = await calculateProviderRating(req.user.id);

    return res.json({
      success: true,
      message: 'Provider profile saved.',
      data: { ...sanitizeProviderImages(provider), rating: rating.rating, reviewCount: rating.reviewCount },
      stats: buildStats(provider),
    });
  } catch (err) {
    console.error('upsertMyProvider error', err);
    return res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

const updateProvider = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const ownedProvider = await prisma.providerProfile.findFirst({
      where: { id, userId: req.user.id },
      select: { id: true },
    });
    if (!ownedProvider) {
      return res.status(403).json({ success: false, message: 'You can only update your own provider profile.' });
    }

    const provider = await prisma.providerProfile.update({
      where: { id },
      data,
    });
    clearProviderListCache();

    return res.json({ success: true, data: sanitizeProviderImages(provider) });
  } catch (err) {
    console.error('updateProvider error', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const deleteProvider = async (req, res) => {
  try {
    const { id } = req.params;

    const ownedProvider = await prisma.providerProfile.findFirst({
      where: { id, userId: req.user.id },
      select: { id: true },
    });
    if (!ownedProvider) {
      return res.status(403).json({ success: false, message: 'You can only delete your own provider profile.' });
    }
    await prisma.providerProfile.delete({ where: { id } });
    clearProviderListCache();
    return res.json({ success: true });
  } catch (err) {
    console.error('deleteProvider error', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  createProvider,
  uploadProviderImages,
  updateMyProfilePhoto,
  getProviderImages,
  listProviders,
  getProvider,
  getMyProvider,
  upsertMyProvider,
  updateProvider,
  deleteProvider,
  clearProviderListCache,
};
