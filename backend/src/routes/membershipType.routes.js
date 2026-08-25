const express = require("express");
const router = express.Router();
const membershipTypeController = require("../controllers/membershipTypeController");

router.get("/", membershipTypeController.getMembershipTypes);

module.exports = router;