const express = require("express");
const router = express.Router();

const authRoutes = require("./auth.routes");
const applicationRoutes = require("./application.routes");
const memberRoutes = require("./member.routes");
const officerRoleRoutes = require("./officerRole.routes");
const permissionRoutes = require("./permission.routes");
const auditLogRoutes = require("./auditLog.routes");
const membershipTypeRoutes = require("./membershipType.routes");

router.use("/auth", authRoutes);
router.use("/applications", applicationRoutes);
router.use("/members", memberRoutes);
router.use("/officer-roles", officerRoleRoutes);
router.use("/permissions", permissionRoutes);
router.use("/audit-logs", auditLogRoutes);
router.use("/membership-types", membershipTypeRoutes);

// Health check endpoint
router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Member Management API is running",
    timestamp: new Date().toISOString()
  });
});

module.exports = router;