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
const rateLimit = require("express-rate-limit");
const { Server } = require("socket.io");

dotenv.config();

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 3002;

// Socket.IO configuration
const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      return callback(null, origin);
    },
    credentials: true,
  },
});

// Make io accessible to routes
app.set("io", io);

// Security middleware
app.use(helmet());
app.use(morgan("dev"));

// CORS dinamis, izinkan semua origin yang datang
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // untuk Postman, curl, dll.
      return callback(null, origin); // izinkan semua origin
    },
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: process.env.RATE_LIMIT_MAX_REQUESTS || 100, // limit each IP to 100 requests per windowMs
  message: "Terlalu banyak request dari IP ini, coba lagi nanti.",
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

app.use(cookieParser());
app.use(express.json({ limit: "10mb" })); // Increase limit for clipboard data
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

const sessionDuration = 3600000; // 1 jam

app.use(
  session({
    secret: process.env.SESSION_SECRET || "ClipboardSync2024",
    name: "clipboard_sessid",
    resave: false,
    saveUninitialized: false,
    cookie: {
      expires: new Date(Date.now() + sessionDuration),
      maxAge: sessionDuration,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    },
  })
);

app.set("view engine", "ejs");
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Health check route
app.get("/", (req, res) => {
  res.json({
    message: `${process.env.APP_NAME} v${
      process.env.VERSION || `beta-${Date.now()}`
    } is running!`,
    version: process.env.VERSION || `beta-${Date.now()}`,
    status: "active",
  });
});

// Load router dinamis
const arr_router = [
  "auth",
  "user",
  // "device",
  // "clipboard",
  // "sync",
  // Add more routers as needed
];

const arr = {};
arr_router.forEach((e) => {
  try {
    if (typeof e === "object" && e.list && e.list.length > 0) {
      e.list.forEach((x) => {
        arr[
          `router_${e.list[x]}`
        ] = require(`./router/${e.folder}/${e.list[x]}/index`);
      });
    } else if (typeof e === "string") {
      arr[`router_${e}`] = require(`./router/router_${e}`);
    } else {
      console.warn(
        `Router '${e}' is neither an object nor a string, skipping...`
      );
    }
  } catch (error) {
    console.warn(`Router '${e}' not found, skipping...`);
  }
});

// Load model dan sync database
const db = require("./models");

(async () => {
  try {
    await db.sequelize.sync();
    console.log("Database synchronized successfully");
  } catch (error) {
    console.error("Database sync error:", error);
  }
})();

// Gunakan semua router yang sudah dimuat
for (let x in arr) {
  app.use("/api", arr[x]); // Prefix semua route dengan /api
}

// Socket.IO untuk real-time clipboard sync
const activeUsers = new Map(); // Store user_id -> [socket_ids]

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error("Authentication token required"));
    }

    // Verify JWT token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key"
    );
    socket.userId = decoded.userId;
    socket.deviceId = decoded.deviceId;

    next();
  } catch (error) {
    next(new Error("Invalid token"));
  }
});

io.on("connection", (socket) => {
  const userId = socket.userId;
  const deviceId = socket.deviceId;

  console.log(
    `Device connected - User: ${userId}, Device: ${deviceId}, Socket: ${socket.id}`
  );

  // Add user to active users map
  if (!activeUsers.has(userId)) {
    activeUsers.set(userId, []);
  }
  activeUsers.get(userId).push({
    socketId: socket.id,
    deviceId: deviceId,
  });

  // Join user-specific room
  socket.join(`user:${userId}`);

  // Handle clipboard data from client
  socket.on("clipboard:push", async (data) => {
    try {
      console.log(`Clipboard push from device ${deviceId}:`, {
        type: data.content_type,
        size: data.content_text?.length || 0,
      });

      // Broadcast to all other devices of the same user
      socket.to(`user:${userId}`).emit("clipboard:new", {
        clipboardId: data.clipboardId,
        deviceId: deviceId,
        contentType: data.content_type,
        contentText: data.content_text,
        contentUrl: data.content_url,
        fileName: data.file_name,
        createdAt: data.createdAt || new Date(),
      });

      // Acknowledge receipt
      socket.emit("clipboard:pushed", {
        success: true,
        clipboardId: data.clipboardId,
      });
    } catch (error) {
      console.error("Error broadcasting clipboard:", error);
      socket.emit("clipboard:error", {
        message: "Failed to sync clipboard",
      });
    }
  });

  // Handle sync request
  socket.on("clipboard:request-sync", async (data) => {
    try {
      // Request latest clipboard from server
      socket.emit("clipboard:sync-requested", {
        success: true,
        message: "Sync request received",
      });
    } catch (error) {
      console.error("Sync request error:", error);
    }
  });

  // Handle typing indicator (optional feature)
  socket.on("clipboard:typing", (data) => {
    socket.to(`user:${userId}`).emit("clipboard:user-typing", {
      deviceId: deviceId,
      isTyping: data.isTyping,
    });
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log(`Device disconnected - User: ${userId}, Socket: ${socket.id}`);

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
    });
  });

  // Send online status to user's other devices
  socket.to(`user:${userId}`).emit("device:online", {
    deviceId: deviceId,
  });
});

// Helper function to emit to specific user (accessible from routes)
app.emitToUser = (userId, event, data) => {
  io.to(`user:${userId}`).emit(event, data);
};

// Middleware untuk error handler
app.use((err, req, res, next) => {
  console.error("Internal Server Error:", err.stack);
  res.status(500).json({
    success: false,
    message:
      process.env.NODE_ENV === "production"
        ? "Something went wrong!"
        : err.message,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Rute tidak ditemukan atau tidak valid",
  });
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, closing server gracefully...");
  server.close(() => {
    console.log("Server closed");
    db.sequelize.close();
    process.exit(0);
  });
});

// Start server
server.listen(port, () => {
  console.log(`✅ ${process.env.APP_NAME} Server running on port ${port}`);
  console.log(`📡 Socket.IO server ready for real-time sync`);
  console.log(`🔒 Environment: ${process.env.NODE_ENV || "development"}`);
});

module.exports = { app, server, io };
