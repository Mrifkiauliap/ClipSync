const express = require("express");
// const { body } = require("express-validator");
const router = express.Router();
const controllers = require("../modules/user/controllers");

const { authenticateToken } = require("../middleware/auth");

router.get("/user/profile", authenticateToken, controllers.userProfile);

module.exports = router;
