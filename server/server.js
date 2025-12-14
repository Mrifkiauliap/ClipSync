const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const process = require("process");
const express = require("express");
const path = require("path");
const session = require("express-session");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const helmet = require("helmet");
const http = require("http");
const compression = require("compression");
const { sequelize } = require("./models");
const { Server } = require("socket.io");
const { globalLimiter } = require("./middleware/rateLimiters");
const { startCleanupJob } = require("./jobs");
const { insertClipboard } = require("./services/clipboard");

dotenv.config();
const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 3000;

// Allowed origins untuk CORS (production-ready)
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["http://localhost:3000", "http://localhost:5173"];

// Socket.IO configuration
const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (process.env.NODE_ENV === "production") {
        // Production: strict whitelist
        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error("Not allowed by CORS"));
      }

      // Development: allow all
      return callback(null, origin);
    },
    credentials: true,
  },
  pingTimeout: process.env.SOCKET_PING_TIMEOUT,
  pingInterval: process.env.SOCKET_PING_INTERVAL,
});

app.set("io", io);
app.set("trust proxy", 1);

// Security middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  }),
);

// Logging middleware
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// Request parsing
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Compression middleware
app.use(compression());

// CORS konfigurasi
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (process.env.NODE_ENV === "production") {
        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error("Not allowed by CORS"));
      }

      // Development mode: allow all
      return callback(null, origin);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Global Rate limiting
app.use(globalLimiter);

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || "ClipboardSync2024",
    name: "clipboard_sessid",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * (Number(process.env.SESSION_EXPIRE_HOURS) || 1),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    },
  }),
);

app.set("view engine", "ejs");

// Health cek route
app.get("/", (req, res) => {
  const version = process.env.VERSION || `beta-${Date.now()}`;

  res.json({
    message: `${process.env.APP_NAME} v${version} is running!`,
    version,
    status: "active",
    timestamp: new Date().toISOString(),
  });
});

// Health cek endpoint (untuk monitoring)
app.get("/health", async (req, res) => {
  if (req.headers["x-health-token"] !== process.env.HEALTH_TOKEN)
    return res.status(403).json({ status: "forbidden" });

  const checks = {};

  try {
    const dbStatus = await sequelize
      .authenticate()
      .then(() => "connected")
      .catch(() => "disconnected");
    checks.database = dbStatus;

    checks.socket = io.engine ? "active" : "inactive";

    const allHealthy = Object.values(checks).every(
      (s) => s === "connected" || s === "active",
    );

    res.status(allHealthy ? 200 : 503).json({
      status: allHealthy ? "ok" : "degraded",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      checks,
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
});

// Load router dinamis
const arr_router = ["auth", "device", "dashboard", "clipboard"];

const arr = {};
arr_router.forEach((e) => {
  try {
    if (typeof e === "object" && e.list && e.list.length > 0) {
      e.list.forEach((x) => {
        arr[`router_${e.list[x]}`] = require(
          `./router/${e.folder}/${e.list[x]}/index`,
        );
      });
    } else if (typeof e === "string") {
      arr[`router_${e}`] = require(`./router/router_${e}`);
    } else {
      console.warn(
        `Router '${e}' is neither an object nor a string, skipping...`,
      );
    }
  } catch (error) {
    console.warn(`Router '${e}' tidak ditemukan: ${error.message}`);
  }
});

// Hubungkan semua rute
for (let x in arr) {
  app.use("/api", arr[x]);
}

// Load model dan sinkronisasi database
const db = require("./models");
const { timeStamp } = require("console");

(async () => {
  try {
    const syncOptions = { alter: false };
    await db.sequelize.sync(syncOptions);
    console.log("✅ Sinkronisasi Database Berhasil");
  } catch (error) {
    console.error("Sinkronisasi Database Gagal:", error);
    process.exit(1);
  }
})();

// ============================================
// Socket.IO Setup
// ============================================
const activeUsers = new Map(); // Simpan user_id -> [socket_ids]

// Socket.IO authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error("Authentication token required"));
    }

    // Verify JWT token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "iJDhSEraPbSq3YUGYKcDhylOPmv/wm6K1sP/uhngyoY=",
    );

    socket.userId = decoded.userId;
    socket.deviceId = decoded.deviceId;

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return next(new Error("Token expired"));
    }
    if (error.name === "JsonWebTokenError") {
      return next(new Error("Invalid token"));
    }
    console.error("Socket auth error:", error.message);
    next(new Error("Unknown error"));
  }
});

// Socket.IO connection handler
io.on("connection", (socket) => {
  const userId = socket.userId;
  const deviceId = socket.deviceId;

  console.log(`Device connected - User: ${userId}, Device: ${deviceId}`);

  // Add user to active users map
  if (!activeUsers.has(userId)) {
    activeUsers.set(userId, []);
  }
  activeUsers.get(userId).push({
    socketId: socket.id,
    deviceId: deviceId,
    connectedAt: Date.now(),
  });

  // Join user-specific room
  socket.join(`user:${userId}`);

  // Notify other devices about new connection
  socket.to(`user:${userId}`).emit("device:online", {
    deviceId: deviceId,
    message: "Perangkat online",
    timestamp: new Date().toISOString(),
  });

  // Handle clipboard data from client
  socket.on("clipboard:push", async (data) => {
    try {
      console.log(`📋 Clipboard push from device ${deviceId}:`, {
        type: data.content_type,
        size: data.content_text?.length || 0,
      });

      const clipboardId = await insertClipboard(data);

      console.log(`📋 Clipboard ID: ${clipboardId.id}`);

      // Broadcast to all other devices of the same user
      socket.to(`user:${userId}`).emit("clipboard:new", {
        clipboardId: clipboardId,
        deviceId: deviceId,
        contentName: null,
        contentType: data.content_type,
        contentText: data.content_text,
        contextSize: data.content_text?.length || 0,
        timestamp: new Date().toISOString(),
      });

      // Acknowledge receipt
      socket.emit("clipboard:pushed", {
        error: false,
        clipboardId: clipboardId,
        message: "Clipboard berhasil diteruskan",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error broadcasting clipboard:", error);
      socket.emit("clipboard:error", {
        error: true,
        message: "Gagal mengirim clipboard",
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Handle sync request
  socket.on("clipboard:request-sync", async () => {
    try {
      socket.emit("clipboard:sync-requested", {
        error: false,
        message: "Sinkronisasi request diterima",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Sync request error:", error);
      socket.emit("clipboard:error", {
        error: true,
        message: "Sinkronisasi request gagal",
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Handle disconnect
  socket.on("disconnect", (reason) => {
    console.log(`Device disconnected - User: ${userId}, Reason: ${reason}`);

    // Remove from active users
    if (activeUsers.has(userId)) {
      const userSockets = activeUsers.get(userId);
      const filtered = userSockets.filter((s) => s.socketId !== socket.id);

      if (filtered.length === 0) {
        activeUsers.delete(userId);
      } else {
        activeUsers.set(userId, filtered);
      }
    }

    // Notify other devices
    socket.to(`user:${userId}`).emit("device:offline", {
      deviceId: deviceId,
      message: "Perangkat offline",
      timestamp: new Date().toISOString(),
    });
  });

  // Handle errors
  socket.on("error", (error) => {
    console.error(`Socket error for user ${userId}:`, error);
  });
});

// Helper function to emit to specific user (accessible from routes)
app.emitToUser = (userId, event, data) => {
  io.to(`user:${userId}`).emit(event, data);
};

// Helper to get active devices for a user
app.getActiveDevices = (userId) => {
  return activeUsers.get(userId) || [];
};

// ============================================
// Error Handlers
// ============================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: true,
    message: "Rute tidak ditemukan atau tidak valid",
    path: req.originalUrl,
    method: req.method,
  });
});

// ============================================
// Graceful Shutdown
// ============================================

const gracefulShutdown = async (signal) => {
  server.close(async () => {
    console.log("✅ HTTP server ditutup");

    io.close(() => {
      console.log("✅ Socket.IO server ditutup");
    });

    try {
      await db.sequelize.close();
      console.log("✅ Koneksi database berhasil ditutup");
    } catch (error) {
      console.error("Error ketika menutup database:", error);
    }

    process.exit(0);
  });

  // Force close after 10 seconds
  setTimeout(() => {
    console.error("⚠️ Forced shutdown after timeout");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Unhandled rejection handler
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  // Dalam production, log ke monitoring service (Sentry, Winston, dll)
});

// ============================================
// Start Server
// ============================================

// Jalankan cleanup scheduler
console.log("Clipboard cleanup job started");
startCleanupJob();

// Start server
server.listen(port, () => {
  console.log(`
╔══════════════════════════════════════════════╗
║  ✅ ${process.env.APP_NAME || "Server"} is running!
║  📡 Port: ${port}
║  🔒 Environment: ${process.env.NODE_ENV || "development"}
║  🌐 Socket.IO: Ready
╚══════════════════════════════════════════════╝
  `);
});

module.exports = { app, server, io };
