const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sequelize, User, Device, Session } = require("../models");
const { v4: uuidv4 } = require("uuid");
const { authLimiter, routeLimiter } = require("../middleware/rateLimiters");
const { authenticateToken } = require("../middleware/auth");
const { verifyPassword, hashPassword } = require("../helper/cryptoHelper");

// Helper: Buat JWT Token
const generateToken = (userId, deviceId) => {
  return jwt.sign(
    { type: "access", userId, deviceId, nonce: uuidv4() },
    process.env.JWT_SECRET || "iJDhSEraPbSq3YUGYKcDhylOPmv/wm6K1sP/uhngyoY=",
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
  );
};

// Helper: Buat Refresh Token
const generateRefreshToken = () => {
  return jwt.sign(
    { type: "refresh", nonce: uuidv4() },
    process.env.REFRESH_TOKEN_SECRET ||
      "0tn0Wd3R86DOqjByK/KdI8SJ/icZV/RrFg1dPo/r8ic=",
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "30d",
    },
  );
};

/**
 * POST /api/auth/register
 * Register user baru
 */
router.post("/auth/register", authLimiter, async (req, res) => {
  try {
    let { nama, email, password } = req.body;

    nama = nama.trim();
    email = email.trim().toLowerCase();
    password = password.trim();

    // Validasi
    if (!nama || !email || !password) {
      return res.status(400).json({
        error: true,
        message: "Nama, email, dan password wajib diisi",
      });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        error: true,
        message: "Email sudah terdaftar",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: true,
        message: "Password minimal 6 karakter",
      });
    }

    const hashedPassword = await hashPassword(password);

    const user = await User.create({
      nama,
      email,
      password: hashedPassword,
      is_active: true,
    });

    res.status(201).json({
      error: false,
      message: "Registrasi berhasil",
      data: {
        id: user.id,
        nama: user.nama,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({
      error: true,
      message: "Gagal melakukan registrasi",
    });
  }
});

/**
 * POST /api/auth/login
 * Login user dan register device
 */
router.post("/auth/login", authLimiter, async (req, res) => {
  try {
    const { email, password, device_name, device_identifier, device_type } =
      req.body;

    if (!email || !password || !device_name || !device_identifier) {
      return res.status(400).json({
        error: true,
        message: "Field wajib tidak lengkap",
      });
    }

    const user = await User.findOne({ where: { email } });
    if (!user || !(await verifyPassword(password, user.password))) {
      return res.status(401).json({
        error: true,
        message: "Email atau password salah",
      });
    }

    let device;

    await sequelize.transaction(async (t) => {
      const conflictDevice = await Device.findOne({
        where: { device_identifier },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (conflictDevice && conflictDevice.user_id !== user.id) {
        throw new Error("DEVICE_TAKEN");
      }

      [device] = await Device.upsert(
        {
          user_id: user.id,
          device_name,
          device_identifier,
          device_type: device_type || "android",
          is_active: true,
          last_active: new Date(),
        },
        {
          returning: true,
          transaction: t,
        },
      );

      const token = generateToken(user.id, device.id);
      const refreshToken = generateRefreshToken();

      const expiresAt = new Date();
      expiresAt.setDate(
        expiresAt.getDate() + parseInt(process.env.JWT_EXPIRES_IN || 7),
      );

      await Session.upsert(
        {
          user_id: user.id,
          device_id: device.id,
          token,
          refresh_token: refreshToken,
          expires_at: expiresAt,
        },
        { transaction: t },
      );

      res.json({
        error: false,
        message: "Login berhasil",
        data: {
          user: {
            id: user.id,
            nama: user.nama,
            email: user.email,
          },
          device: {
            id: device.id,
            name: device.device_name,
            type: device.device_type,
          },
          token,
          refreshToken,
          expiresAt,
        },
      });
    });
  } catch (err) {
    console.error("Login error:", err);

    if (err.message === "DEVICE_TAKEN") {
      return res.status(403).json({
        error: true,
        message: "Device identifier sudah terdaftar pada user lain",
      });
    }

    res.status(500).json({
      error: true,
      message: "Gagal melakukan login",
    });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token
 */
router.post("/auth/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        error: true,
        message: "Refresh token wajib diisi",
      });
    }

    // Verifikasi token
    jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET ||
        "0tn0Wd3R86DOqjByK/KdI8SJ/icZV/RrFg1dPo/r8ic=",
    );

    const session = await Session.findOne({
      where: { refresh_token: refreshToken },
      include: [
        {
          model: User,
          as: "user",
        },
        {
          model: Device,
          as: "device",
        },
      ],
    });

    if (!session) {
      return res.status(401).json({
        error: true,
        message: "Invalid refresh token",
      });
    }

    if (new Date() > new Date(session.expires_at)) {
      await session.destroy();
      return res.status(401).json({
        error: true,
        message: "Session expired, please login again",
      });
    }

    // Buat Token Baru
    const newToken = generateToken(session.user_id, session.device_id);
    const newRefreshToken = generateRefreshToken();

    // Update sesi
    const expiresAt = new Date();
    expiresAt.setDate(
      expiresAt.getDate() + parseInt(process.env.JWT_EXPIRES_IN || 7),
    ); // Limit di 7 hari

    await session.update({
      token: newToken,
      refresh_token: newRefreshToken,
      expires_at: expiresAt,
    });

    res.json({
      error: false,
      message: "Token refreshed",
      data: {
        token: newToken,
        refreshToken: newRefreshToken,
        expiresAt,
      },
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(401).json({
      error: true,
      message: "Invalid or expired refresh token",
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout dari device saat ini
 */
router.post(
  "/auth/logout",
  authenticateToken,
  routeLimiter(10, 10),
  async (req, res) => {
    const t = await sequelize.transaction();
    try {
      // Hapus sesi dan Update Device status berdasarkan deviceId
      await Promise.all([
        Session.destroy({
          where: { device_id: req.deviceId },
          transaction: t,
        }),
        Device.update(
          { is_active: false },
          { where: { id: req.deviceId }, transaction: t },
        ),
      ]);
      await t.commit();
      res.json({
        error: false,
        message: "Logout berhasil",
      });
    } catch (error) {
      await t.rollback();
      console.error("Logout error:", error);
      return res.status(500).json({
        error: true,
        message: "Gagal logout",
      });
    }
  },
);

/**
 * POST /api/auth/logout-all
 * Logout dari semua devices
 */
router.post(
  "/auth/logout-all",
  authenticateToken,
  routeLimiter(5, 10),
  async (req, res) => {
    const t = await sequelize.transaction();
    try {
      // Hapus sesi dan Update Device status berdasarkan userId
      await Promise.all([
        Session.destroy({
          where: { user_id: req.userId },
          transaction: t,
        }),
        Device.update(
          { is_active: false },
          { where: { user_id: req.userId }, transaction: t },
        ),
      ]);
      await t.commit();
      res.json({
        error: false,
        message: "Logout berhasil",
      });
    } catch (error) {
      console.error("Logout all error:", error);
      res.status(500).json({
        error: true,
        message: "Gagal logout",
      });
    }
  },
);

/**
 * GET /api/auth/me
 * Get current user info
 */
router.get(
  "/auth/me",
  authenticateToken,
  routeLimiter(30, 1),
  async (req, res) => {
    try {
      const user = await User.findByPk(req.userId, {
        attributes: ["id", "nama", "email", "is_active", "createdAt"],
        include: [
          {
            model: Device,
            as: "devices",
            where: { id: decoded.deviceId },
            attributes: [
              "id",
              "device_name",
              "device_identifier",
              "device_type",
              "last_active",
              "is_active",
            ],
            required: true,
          },
        ],
        raw: true,
        nest: true,
      });

      if (!user) {
        return res.status(404).json({
          error: true,
          message: "User tidak ditemukan",
        });
      }

      res.json({
        error: false,
        data: {
          id: user.id,
          nama: user.nama,
          email: user.email,
          is_active: user.is_active,
          createdAt: user.createdAt,
          devices: {
            id: user.devices.id,
            device_name: user.devices.device_name,
            device_identifier: user.devices.device_identifier,
            device_type: user.devices.device_type,
            last_active: user.devices.last_active,
            is_active: user.devices.is_active,
          },
        },
      });
    } catch (error) {
      console.error("Get me error:", error);
      res.status(500).json({
        error: true,
        message: "Terjadi kesalahan pada server",
      });
    }
  },
);

module.exports = router;
