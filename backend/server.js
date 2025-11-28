// backend/server.js
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/authRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import Chat from "./models/Chat.js";

dotenv.config();

const app = express();
const httpServer = createServer(app);

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/userAuthDB";

/**
 * CORS configuration
 * - allow the configured FRONTEND_URL
 * - credentials: true so browsers send cookies / auth headers if needed
 */
app.use(
  cors({
    origin: (origin, cb) => {
      // Allow requests from FRONTEND_URL or allow non-browser tools (origin === undefined)
      if (!origin || origin === FRONTEND_URL) return cb(null, true);
      return cb(new Error("CORS: Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  })
);

// parsers
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// -- Register routes (no wildcard route registration that uses "*")
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);

// Basic test endpoint
app.get("/", (req, res) => {
  res.send("✅ Backend working fine!");
});

/**
 * Socket.IO (chat)
 * Keep socket.io CORS aligned with express cors settings.
 */
const io = new Server(httpServer, {
  cors: {
    origin: FRONTEND_URL,
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("join-user", (userId) => {
    try {
      socket.join(`user-${userId}`);
      console.log(`Socket ${socket.id} joined room user-${userId}`);
    } catch (err) {
      console.error("join-user error:", err);
    }
  });

  socket.on("send-message", async (data) => {
    const { senderId, receiverId, message } = data;
    try {
      let chat = await Chat.findOne({
        participants: { $all: [senderId, receiverId] },
      });

      if (!chat) {
        chat = await Chat.create({
          participants: [senderId, receiverId],
          messages: [],
        });
      }

      chat.messages.push({
        sender: senderId,
        message,
        timestamp: new Date(),
      });

      chat.lastMessage = message;
      chat.lastMessageTime = new Date();
      await chat.save();

      io.to(`user-${receiverId}`).emit("receive-message", {
        senderId,
        message,
        timestamp: new Date(),
      });

      io.to(`user-${senderId}`).emit("message-sent", {
        receiverId,
        message,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error("Socket send-message error:", error);
      socket.emit("message-error", { error: "Failed to send message" });
    }
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

app.set("io", io);

/**
 * Optional: serve frontend production build (uncomment if you build React and put in ../frontend/build)
 * NOTE: avoid using app.get('*', ...) if you are using an older router package that breaks on '*'.
 * If you need to serve static build, use explicit fallback for defined client routes only,
 * or use a safe catch-all handler that doesn't register via router.match with a wildcard string.
 */
/*
import path from "path";
const __dirname = path.resolve();
const buildPath = path.join(__dirname, "..", "frontend", "dist"); // or "build" if CRA
if (fs.existsSync(buildPath)) {
  app.use(express.static(buildPath));
  app.get(["/","/login","/student-dashboard","/find-mentor","/my-courses"], (req, res) => {
    res.sendFile(path.join(buildPath, "index.html"));
  });
}
*/

/**
 * Connect DB then start server
 */
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected successfully");
    httpServer.listen(PORT, () =>
      console.log(`🚀 Server running on http://localhost:${PORT}`)
    );
  })
  .catch((err) => {
    console.error("MongoDB Connection Error:", err.message);
    process.exit(1);
  });

/**
 * Graceful shutdown
 */
process.on("SIGINT", () => {
  console.log("SIGINT received — closing server gracefully");
  httpServer.close(() => {
    console.log("HTTP server closed");
    mongoose.connection.close(false, () => {
      console.log("MongoDB connection closed");
      process.exit(0);
    });
  });
});
