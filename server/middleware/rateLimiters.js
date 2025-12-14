import rateLimit from "express-rate-limit";

/**
 * Rate limiter global untuk semua rute
 * 120 requests per menit per IP
 */
export const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 menit
  max: 120,
  message: {
    error: true,
    message: "Terlalu banyak request ke server. Silakan coba lagi nanti!",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter untuk endpoint autentikasi (login, register, dll)
 * Mencegah brute force attacks
 */
export const authLimiter = (nameUrl) => {
  const message = `Terlalu banyak percobaan ${nameUrl}. Silakan coba lagi dalam ${Number(process.env.ACCOUNT_LOCK_TIME) || 15} menit!`;

  return rateLimit({
    windowMs: 1000 * 60 * (Number(process.env.ACCOUNT_LOCK_TIME) || 15),
    max: Number(process.env.MAX_LOGIN_ATTEMPTS) || 5,
    message: {
      error: true,
      message,
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    keyGenerator: (req) => req.body.email || ipKeyGenerator(req),
  });
};

/**
 * Rate limiter untuk operasi yang sangat sensitif
 * Contoh: forgot password, email verification
 */
export const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: {
    error: true,
    message: "Terlalu banyak percobaan. Silakan coba lagi dalam 1 jam!",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Helper function untuk membuat custom rate limiter
 * @param {number} maxRequests - Jumlah maksimum request
 * @param {number} minutes - Durasi window dalam menit
 * @param {Object} options - Opsi tambahan (opsional)
 * @returns {Function} Express rate limiter middleware
 *
 * @example
 * // Limit 30 request per 1 menit
 * router.get(
 *  "/device/list",
 *  routeLimiter(30, 1),
 *  authenticateToken,
 *  controllers.get_device
 * );
 */
export const routeLimiter = (maxRequests, minutes, options = {}) => {
  return rateLimit({
    windowMs: minutes * 60 * 1000,
    max: maxRequests,
    message: {
      error: true,
      message: `Terlalu banyak request. Batas ${maxRequests} request per ${minutes} menit.`,
    },
    standardHeaders: true,
    legacyHeaders: false,
    ...options,
  });
};

export default {
  authLimiter,
  globalLimiter,
  strictLimiter,
  routeLimiter,
};
