const express = require("express");
const router = express.Router();
const controllers = require("../modules/dashboard/controllers");
const { authenticateToken } = require("../middleware/auth");
const { routeLimiter } = require("../middleware/rateLimiters");

/**
 * GET /api/dashboard/info
 * Mendapatkan informasi dasboard
 */
router.get(
  "/dashboard",
  routeLimiter(60, 1),
  authenticateToken,
  controllers.info_dashboard,
);

module.exports = router;
