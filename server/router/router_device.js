const express = require("express");
const { body } = require("express-validator");
const router = express.Router();
const controllers = require("../modules/device/controllers");
const { authenticateToken } = require("../middleware/auth");
const validation = require("../validation/device");
const { routeLimiter } = require("../middleware/rateLimiters");

router.get(
  "/device/list",
  routeLimiter(30, 1),
  authenticateToken,
  controllers.get_device
);

router.post(
  "/device/revoke",
  routeLimiter(15, 1),
  authenticateToken,
  [
    body("device_id")
      .isInt()
      .withMessage("device_id harus berupa integer yang valid.")
      .bail()
      .custom(validation.check_ID_Device_Active),
  ],
  controllers.revoke_device
);

router.post(
  "/device/delete",
  routeLimiter(15, 1),
  authenticateToken,
  [
    body("device_id")
      .isInt()
      .withMessage("device_id harus berupa integer yang valid.")
      .bail()
      .custom(validation.check_ID_Device_Delete),
  ],
  controllers.delete_device
);

module.exports = router;
