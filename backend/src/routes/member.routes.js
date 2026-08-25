const express = require("express");
const router = express.Router();
const memberController = require("../controllers/memberController");
const { requireAuth } = require("../middleware/auth");
const { requirePermission } = require("../middleware/requirePermission");
const { PERMISSION_KEYS } = require("../constants/permissions");

// Member views own membership
router.get("/my-membership", requireAuth, memberController.getMyMembership);

// Staff / Chairman view dashboard summary stats
router.get("/stats", requireAuth, memberController.getMemberStats);

// Staff export members as CSV (bonus feature)
router.get("/export", requireAuth, requirePermission(PERMISSION_KEYS.MEMBER_VIEW), memberController.exportMembersCsv);

// Staff lists members with search/filter/pagination (F-09, F-12)
router.get("/", requireAuth, requirePermission(PERMISSION_KEYS.MEMBER_VIEW), memberController.getMembers);

module.exports = router;