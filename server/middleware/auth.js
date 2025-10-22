const jwt = require("jsonwebtoken");
const { User, Device, Session } = require("../models");

/**
 * Middleware untuk verifikasi JWT token
 */
const authenticateToken = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token tidak ditemukan. Silakan login terlebih dahulu.",
      });
    }

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "iJDhSEraPbSq3YUGYKcDhylOPmv/wm6K1sP/uhngyoY="
    );

    // Check if session exists and valid
    const session = await Session.findOne({
      where: { token },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "nama", "email", "is_active"],
        },
        {
          model: Device,
          as: "device",
          attributes: ["id", "device_name", "device_type", "is_active"],
        },
      ],
    });

    if (!session) {
      return res.status(401).json({
        success: false,
        message: "Session tidak valid. Silakan login kembali.",
      });
    }

    // Check if session expired
    if (new Date() > new Date(session.expires_at)) {
      await session.destroy();
      return res.status(401).json({
        success: false,
        message: "Session expired. Silakan login kembali.",
      });
    }

    // Check if user is active
    if (!session.user.is_active) {
      return res.status(403).json({
        success: false,
        message: "Akun Anda tidak aktif.",
      });
    }

    // Check if device is active
    if (!session.device.is_active) {
      return res.status(403).json({
        success: false,
        message: "Device ini tidak aktif.",
      });
    }

    // Attach user and device info to request
    req.userId = decoded.userId;
    req.deviceId = decoded.deviceId;
    req.user = session.user;
    req.device = session.device;

    // Update device last_active
    await Device.update(
      { last_active: new Date() },
      { where: { id: decoded.deviceId } }
    );

    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Token tidak valid.",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired. Silakan refresh token atau login kembali.",
      });
    }

    console.error("Auth middleware error:", error);
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan pada autentikasi.",
    });
  }
};

/**
 * Optional middleware - hanya verifikasi token tanpa wajib ada
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.replace("Bearer ", "");

    if (!token) {
      return next(); // Lanjut tanpa auth
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "iJDhSEraPbSq3YUGYKcDhylOPmv/wm6K1sP/uhngyoY="
    );

    const session = await Session.findOne({
      where: { token },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "nama", "email"],
        },
        {
          model: Device,
          as: "device",
          attributes: ["id", "device_name", "device_type"],
        },
      ],
    });

    if (session && new Date() <= new Date(session.expires_at)) {
      req.userId = decoded.userId;
      req.deviceId = decoded.deviceId;
      req.user = session.user;
      req.device = session.device;
    }

    next();
  } catch (error) {
    // Ignore errors, lanjut tanpa auth
    next();
  }
};

module.exports = {
  authenticateToken,
  optionalAuth,
};
