const express = require("express");
const router = express.Router();
const auditLogController = require("../controllers/auditLogController");
const { requireAuth } = require("../middleware/auth");
const { requirePermission } = require("../middleware/requirePermission");
const { PERMISSION_KEYS } = require("../constants/permissions");

// View audit logs (F-13, F-12)
router.get("/", requireAuth, requirePermission(PERMISSION_KEYS.AUDIT_VIEW), auditLogController.getAuditLogs);

module.exports = router;