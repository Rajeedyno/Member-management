const express = require("express");
const router = express.Router();
const applicationController = require("../controllers/applicationController");
const { requireAuth } = require("../middleware/auth");
const { requirePermission } = require("../middleware/requirePermission");
const { validateBody } = require("../middleware/validate");
const { submitApplicationSchema, rejectApplicationSchema } = require("../utils/validatorSchemas");
const { PERMISSION_KEYS } = require("../constants/permissions");

// Member submits their own application
router.post("/", requireAuth, validateBody(submitApplicationSchema), applicationController.submitApplication);

// Member views own applications and active membership
router.get("/my", requireAuth, applicationController.getMyApplications);

// Staff lists applications (F-06, F-12)
router.get("/", requireAuth, requirePermission(PERMISSION_KEYS.APPLICATION_VIEW), applicationController.getApplications);

// Get single application
router.get("/:id", requireAuth, applicationController.getApplicationById);

// Staff approves application (F-07, F-12)
router.patch("/:id/approve", requireAuth, requirePermission(PERMISSION_KEYS.APPLICATION_APPROVE), applicationController.approveApplication);

// Staff rejects application (F-08, F-12)
router.patch("/:id/reject", requireAuth, requirePermission(PERMISSION_KEYS.APPLICATION_REJECT), validateBody(rejectApplicationSchema), applicationController.rejectApplication);

module.exports = router;