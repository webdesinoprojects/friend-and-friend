const prisma = require("../config/prisma");

const DISABLE_DURATION_MS = 24 * 60 * 60 * 1000;

function isAccountDisabled(user, now = new Date()) {
  if (!user?.disabledUntil) return false;
  return new Date(user.disabledUntil).getTime() > now.getTime();
}

async function activateIfExpired(user) {
  if (!user?.disabledUntil || isAccountDisabled(user)) return user;
  await prisma.user.update({
    where: { id: user.id },
    data: { disabledAt: null, disabledUntil: null },
  });
  return { ...user, disabledAt: null, disabledUntil: null };
}

function publicAccountState(user) {
  return {
    disabledAt: user?.disabledAt || null,
    disabledUntil: user?.disabledUntil || null,
    accountDisabled: isAccountDisabled(user),
  };
}

module.exports = {
  DISABLE_DURATION_MS,
  isAccountDisabled,
  activateIfExpired,
  publicAccountState,
};
