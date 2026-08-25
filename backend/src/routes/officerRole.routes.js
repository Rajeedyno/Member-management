const express = require("express");
const router = express.Router();
const officerRoleController = require("../controllers/officerRoleController");
const { requireAuth } = require("../middleware/auth");
const { requireChairman } = require("../middleware/requireChairman");
const { validateBody } = require("../middleware/validate");
const {
  createOfficerRoleSchema,
  updateRolePermissionsSchema,
  assignRoleSchema
} = require("../utils/validatorSchemas");

// Chairman lists users for role assignment
router.get("/users", requireAuth, requireChairman, officerRoleController.getStaffUsers);

// List all roles (visible to staff/Chairman)
router.get("/", requireAuth, officerRoleController.getOfficerRoles);

// Chairman creates role (F-10, BR-08)
router.post("/", requireAuth, requireChairman, validateBody(createOfficerRoleSchema), officerRoleController.createOfficerRole);

// Chairman updates role permissions (F-10, BR-08)
router.put("/:id/permissions", requireAuth, requireChairman, validateBody(updateRolePermissionsSchema), officerRoleController.updateRolePermissions);

// Chairman assigns role to user (F-11, BR-08)
router.post("/:id/assign", requireAuth, requireChairman, validateBody(assignRoleSchema), officerRoleController.assignRoleToUser);
router.post("/assign", requireAuth, requireChairman, validateBody(assignRoleSchema), officerRoleController.assignRoleToUser);

module.exports = router;