const express = require("express");
const { body, query, param } = require("express-validator");
const router = express.Router();
const controllers = require("../modules/clipboard/controllers");
const { authenticateToken } = require("../middleware/auth");
const { routeLimiter } = require("../middleware/rateLimiters");
const validation = require("../validation/clipboard");

/**
 * GET /api/clipboard/list
 * Mendapatkan daftar clipboard dengan pagination & filter
 */
router.get(
  "/clipboard/list",
  routeLimiter(60, 1),
  authenticateToken,
  [
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("page harus integer minimal 1")
      .toInt(),

    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("limit harus integer antara 1-100")
      .toInt(),

    query("search")
      .optional()
      .trim()
      .escape()
      .isString()
      .withMessage("search harus berupa string")
      .isLength({ max: 200 })
      .withMessage("search maksimal 200 karakter"),

    query("content_type")
      .optional()
      .isIn(["text", "url"])
      .withMessage("content_type harus: text, image, file, atau url"),

    query("days")
      .optional()
      .isInt({ min: 1, max: 365 })
      .withMessage("days harus integer antara 1-365")
      .toInt(),

    query("device_id")
      .optional()
      .isInt()
      .withMessage("device_id harus nomor yang valid")
      .custom(validation.check_ID_device),
  ],
  controllers.get_clipboard,
);

/**
 * GET /api/clipboard/recent
 * Mendapatkan 9 clipboard terbaru
 */
router.get(
  "/clipboard/recent",
  routeLimiter(60, 1),
  authenticateToken,
  controllers.get_recent_clipboard,
);

/**
 * GET /api/clipboard/:id
 * Mendapatkan detail clipboard
 */
router.get(
  "/clipboard/:id",
  routeLimiter(60, 1),
  authenticateToken,
  [
    param("id")
      .isInt()
      .withMessage("ID harus nomor yang valid")
      .custom(validation.check_ID_clipboard),
  ],
  controllers.get_clipboard_by_id,
);

/**
 * POST /api/clipboard
 * Membuat clipboard baru
 */
router.post(
  "/clipboard",
  routeLimiter(30, 1),
  authenticateToken,
  [
    body("content_type")
      .notEmpty()
      .withMessage("content_type wajib diisi")
      .isIn(["text", "url"])
      .withMessage("content_type tidak valid"),

    body("content_text")
      .optional()
      .trim()
      .isString()
      .withMessage("content_text harus string")
      .isLength({ max: 50000 })
      .withMessage("content_text maksimal 50000 karakter"),

    body("content_name")
      .optional()
      .trim()
      .isString()
      .withMessage("content_name harus string"),
  ],
  controllers.create_clipboard,
);

/**
 * DELETE /api/clipboard/:id
 * Menghapus clipboard
 */
router.delete(
  "/clipboard/:id",
  routeLimiter(30, 1),
  authenticateToken,
  [
    param("id")
      .isInt()
      .withMessage("ID harus nomor yang valid")
      .custom(validation.check_ID_clipboard),
  ],
  controllers.delete_clipboard,
);

/**
 * DELETE /api/clipboard/bulk
 * Menghapus multiple clipboard
 */
router.delete(
  "/clipboard/bulk",
  routeLimiter(10, 1),
  authenticateToken,
  [
    body("clipboard_ids")
      .isArray({ min: 1, max: 100 })
      .withMessage("clipboard_ids harus array dengan 1-100 item"),

    body("clipboard_ids.*")
      .isInt()
      .withMessage("Setiap ID harus nomor yang valid"),
  ],
  controllers.delete_clipboard_bulk,
);

/**
 * PATCH /api/clipboard/:id/favorite
 * Toggle favorite status
 */
router.patch(
  "/clipboard/:id/favorite",
  routeLimiter(45, 1),
  authenticateToken,
  [
    param("id")
      .isInt()
      .withMessage("ID harus nomor yang valid")
      .custom(validation.check_ID_clipboard),
  ],
  controllers.toggle_favorite,
);

/**
 * GET /api/clipboard/stats
 * Mendapatkan statistik clipboard
 */
router.get(
  "/clipboard/stats",
  routeLimiter(30, 1),
  authenticateToken,
  controllers.get_clipboard_stats,
);

module.exports = router;
