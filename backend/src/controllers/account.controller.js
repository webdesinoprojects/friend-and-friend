const prisma = require("../config/prisma");
const { deleteImageKitFile } = require("../utils/imagekit");
const { DISABLE_DURATION_MS, isAccountDisabled, publicAccountState } = require("../utils/accountLifecycle");
const { clearProviderListCache } = require("./provider.controller");

function accountResponse(user) {
  return {
    id: user.id,
    role: user.role,
    ...publicAccountState(user),
  };
}

exports.getStatus = async (req, res) => {
  return res.json({ success: true, data: accountResponse(req.user) });
};

exports.disableFor24Hours = async (req, res) => {
  try {
    if (isAccountDisabled(req.user)) {
      return res.json({ success: true, message: "Account is already temporarily disabled.", data: accountResponse(req.user) });
    }
    const disabledAt = new Date();
    const disabledUntil = new Date(disabledAt.getTime() + DISABLE_DURATION_MS);
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { disabledAt, disabledUntil },
      select: { id: true, role: true, disabledAt: true, disabledUntil: true },
    });
    clearProviderListCache();
    return res.json({
      success: true,
      message: "Your account is hidden for 24 hours. You can reactivate it at any time.",
      data: accountResponse(user),
    });
  } catch (error) {
    console.error("DISABLE_ACCOUNT_ERROR:", error);
    return res.status(500).json({ success: false, message: "Could not disable your account." });
  }
};

exports.reactivate = async (req, res) => {
  try {
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { disabledAt: null, disabledUntil: null },
      select: { id: true, role: true, disabledAt: true, disabledUntil: true },
    });
    clearProviderListCache();
    return res.json({ success: true, message: "Your account and profile are active again.", data: accountResponse(user) });
  } catch (error) {
    console.error("REACTIVATE_ACCOUNT_ERROR:", error);
    return res.status(500).json({ success: false, message: "Could not reactivate your account." });
  }
};

exports.deletePermanently = async (req, res) => {
  try {
    if (String(req.body?.confirmation || "").trim().toUpperCase() !== "DELETE") {
      return res.status(400).json({ success: false, message: "Type DELETE to confirm permanent account deletion." });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { providerProfile: { select: { profileImages: true } } },
    });
    if (!user) return res.status(404).json({ success: false, message: "Account not found." });

    const media = await prisma.chatMessage.findMany({
      where: {
        mediaFileId: { not: null },
        thread: { OR: [{ userId: user.id }, { providerUserId: user.id }] },
      },
      select: { mediaFileId: true },
    });
    const providerImages = Array.isArray(user.providerProfile?.profileImages) ? user.providerProfile.profileImages : [];
    const fileIds = new Set([
      ...media.map((item) => item.mediaFileId),
      ...providerImages.map((item) => typeof item === "object" ? item?.fileId : null),
    ].filter(Boolean));

    await prisma.$transaction(async (tx) => {
      const registrationApplications = await tx.registrationApplication.findMany({
        where: {
          OR: [
            { approvedUserId: user.id },
            { phone: user.phone },
            ...(user.email ? [{ email: user.email }] : []),
          ],
        },
        select: { id: true },
      });
      const registrationApplicationIds = registrationApplications.map((item) => item.id);

      await tx.accountDeletionAudit.create({ data: { originalUserId: user.id, role: user.role } });
      await tx.notification.deleteMany({ where: { userId: user.id } });
      await tx.kycReviewHistory.deleteMany({
        where: {
          userId: {
            in: [user.id, ...registrationApplicationIds],
          },
        },
      });
      await tx.reviewReport.deleteMany({ where: { reportedUserId: user.id } });
      await tx.loginAttempt.deleteMany({ where: { OR: [{ userId: user.id }, ...(user.email ? [{ email: user.email }] : [])] } });
      await tx.otpToken.deleteMany({
        where: {
          OR: [
            { userId: user.id },
            { phone: user.phone },
            ...(user.email ? [{ email: user.email }] : []),
          ],
        },
      });
      if (registrationApplicationIds.length) {
        await tx.registrationApplication.deleteMany({
          where: { id: { in: registrationApplicationIds } },
        });
      }
      await tx.user.delete({ where: { id: user.id } });
    });

    clearProviderListCache();
    await Promise.allSettled([...fileIds].map((fileId) => deleteImageKitFile(fileId)));
    return res.json({ success: true, accountDeleted: true, message: "Your account has been permanently deleted." });
  } catch (error) {
    console.error("DELETE_ACCOUNT_ERROR:", error);
    return res.status(500).json({ success: false, message: "Could not permanently delete your account." });
  }
};
