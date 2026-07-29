const prisma = require("../config/prisma");

function isAccountDisabled(user) {
  return Boolean(user?.disabledAt);
}

async function activateIfExpired(user) {
  return user;
}

function publicAccountState(user) {
  return {
    disabledAt: user?.disabledAt || null,
    disabledUntil: user?.disabledUntil || null,
    accountDisabled: isAccountDisabled(user),
  };
}

module.exports = {
  isAccountDisabled,
  activateIfExpired,
  publicAccountState,
};
