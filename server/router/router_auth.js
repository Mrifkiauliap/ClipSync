const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User, Device, Session } = require("../models");
const { v4: uuidv4 } = require("uuid");

// Helper: Generate JWT Token
const generateToken = (userId, deviceId) => {
  return jwt.sign(
    { userId, deviceId },
    process.env.JWT_SECRET || "iJDhSEraPbSq3YUGYKcDhylOPmv/wm6K1sP/uhngyoY=",
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
};

// Helper: Generate Refresh Token
const generateRefreshToken = () => {
  return jwt.sign(
    { type: "refresh", nonce: uuidv4() },
    process.env.REFRESH_TOKEN_SECRET ||
      "0tn0Wd3R86DOqjByK/KdI8SJ/icZV/RrFg1dPo/r8ic=",
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "30d" }
  );
};

/**
 * POST /api/auth/register
 * Register new user
 */
router.post("/auth/register", async (req, res) => {
  try {
    const { nama, email, password } = req.body;

    // Validation
    if (!nama || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Nama, email, dan password wajib diisi",
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email sudah terdaftar",
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password minimal 6 karakter",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(
      password,
      parseInt(process.env.BCRYPT_ROUNDS) || 10
    );

    // Create user
    const user = await User.create({
      nama,
      email,
      password: hashedPassword,
      is_active: true,
    });

    res.status(201).json({
      success: true,
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
      success: false,
      message: "Gagal melakukan registrasi",
    });
  }
});

/**
 * POST /api/auth/login
 * Login user and register device
 */
router.post("/auth/login", async (req, res) => {
  try {
    const { email, password, device_name, device_identifier, device_type } =
      req.body;

    // Validation
    if (!email || !password || !device_name || !device_identifier) {
      return res.status(400).json({
        success: false,
        message:
          "Email, password, device_name, dan device_identifier wajib diisi",
      });
    }

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Email atau password salah",
      });
    }

    // Check if user is active
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: "Akun Anda tidak aktif",
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Email atau password salah",
      });
    }

    // Find or create device
    let device = await Device.findOne({
      where: {
        user_id: user.id,
        device_identifier,
      },
    });

    if (!device) {
      // Create new device
      device = await Device.create({
        user_id: user.id,
        device_name,
        device_identifier,
        device_type: device_type || "android",
        is_active: true,
        last_active: new Date(),
      });
    } else {
      // Update existing device
      await device.update({
        device_name,
        device_type: device_type || device.device_type,
        is_active: true,
        last_active: new Date(),
      });
    }

    // Generate tokens
    const token = generateToken(user.id, device.id);
    const refreshToken = generateRefreshToken();

    // Calculate token expiry
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    // Create or update session
    await Session.destroy({
      where: {
        user_id: user.id,
        device_id: device.id,
      },
    });

    await Session.create({
      user_id: user.id,
      device_id: device.id,
      token,
      refresh_token: refreshToken,
      expires_at: expiresAt,
    });

    res.json({
      success: true,
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
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
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
        success: false,
        message: "Refresh token wajib diisi",
      });
    }

    // Verify refresh token
    jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET ||
        "0tn0Wd3R86DOqjByK/KdI8SJ/icZV/RrFg1dPo/r8ic="
    );

    // Find session with this refresh token
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
        success: false,
        message: "Invalid refresh token",
      });
    }

    // Check if session expired
    if (new Date() > new Date(session.expires_at)) {
      await session.destroy();
      return res.status(401).json({
        success: false,
        message: "Session expired, please login again",
      });
    }

    // Generate new tokens
    const newToken = generateToken(session.user_id, session.device_id);
    const newRefreshToken = generateRefreshToken();

    // Update session
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await session.update({
      token: newToken,
      refresh_token: newRefreshToken,
      expires_at: expiresAt,
    });

    res.json({
      success: true,
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
      success: false,
      message: "Invalid or expired refresh token",
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout from current device
 */
router.post("/auth/logout", async (req, res) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Token tidak ditemukan",
      });
    }

    // Delete session
    await Session.destroy({ where: { token } });

    res.json({
      success: true,
      message: "Logout berhasil",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Gagal logout",
    });
  }
});

/**
 * POST /api/auth/logout-all
 * Logout from all devices
 */
router.post("/auth/logout-all", async (req, res) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Token tidak ditemukan",
      });
    }

    // Verify token to get user_id
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "iJDhSEraPbSq3YUGYKcDhylOPmv/wm6K1sP/uhngyoY="
    );

    // Delete all sessions for this user
    await Session.destroy({ where: { user_id: decoded.userId } });

    res.json({
      success: true,
      message: "Logout dari semua device berhasil",
    });
  } catch (error) {
    console.error("Logout all error:", error);
    res.status(500).json({
      success: false,
      message: "Gagal logout",
    });
  }
});

/**
 * GET /api/auth/me
 * Get current user info
 */
router.get("/auth/me", async (req, res) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "iJDhSEraPbSq3YUGYKcDhylOPmv/wm6K1sP/uhngyoY="
    );

    // Get user with device info
    const user = await User.findByPk(decoded.userId, {
      attributes: ["id", "nama", "email", "is_active", "createdAt"],
      include: [
        {
          model: Device,
          as: "devices",
          where: { id: decoded.deviceId },
          required: false,
        },
      ],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User tidak ditemukan",
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Get me error:", error);
    res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }
});

module.exports = router;
