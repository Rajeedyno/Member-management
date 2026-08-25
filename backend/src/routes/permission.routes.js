const express = require("express");
const router = express.Router();
const permissionController = require("../controllers/permissionController");
const { requireAuth } = require("../middleware/auth");

router.get("/", requireAuth, permissionController.getPermissions);

module.exports = router;