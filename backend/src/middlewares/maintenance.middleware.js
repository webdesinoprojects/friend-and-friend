const fs = require("fs");
const path = require("path");
const prisma = require("../config/prisma");

const fallbackContentPath = path.join(__dirname, "../../data/adminContent.json");

async function maintenanceEnabled() {
  try {
    const rows = await prisma.$queryRawUnsafe(
      'SELECT "content" FROM "SiteContent" WHERE "id" = $1 LIMIT 1',
      "website"
    );
    return rows[0]?.content?.settings?.maintenanceMode === true;
  } catch (error) {
    try {
      const content = JSON.parse(fs.readFileSync(fallbackContentPath, "utf8"));
      return content?.settings?.maintenanceMode === true;
    } catch {
      return false;
    }
  }
}

async function maintenanceStatus(req, res) {
  return res.json({
    success: true,
    maintenanceMode: await maintenanceEnabled(),
  });
}

async function enforceMaintenance(req, res, next) {
  try {
    // Admin mutations still need a CSRF token while maintenance mode is active.
    if (req.path === "/auth/csrf") return next();
    if (!(await maintenanceEnabled())) return next();
    return res.status(503).json({
      success: false,
      code: "MAINTENANCE_MODE",
      maintenanceMode: true,
      message: "PPlusOne is temporarily unavailable while maintenance is in progress.",
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = { maintenanceStatus, enforceMaintenance };
