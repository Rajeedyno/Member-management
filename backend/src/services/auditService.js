const AuditLog = require("../models/AuditLog");

const getClientIp = (req) => {
  if (!req) return "127.0.0.1";
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return req.ip || req.connection?.remoteAddress || "127.0.0.1";
};

const logAudit = async ({ actorUserId, action, entityType, entityId, details = {}, req = null }) => {
  try {
    const ipAddress = getClientIp(req);
    const log = new AuditLog({
      actorUserId: actorUserId || null,
      action,
      entityType,
      entityId: String(entityId),
      details,
      ipAddress
    });
    await log.save();
    return log;
  } catch (err) {
    console.error("Failed to write audit log:", err.message);
    // Audit log failure should not crash the main business request
    return null;
  }
};

module.exports = {
  logAudit,
  getClientIp
};