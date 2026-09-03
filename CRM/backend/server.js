require("dotenv").config();

const dns = require("dns");

dns.setDefaultResultOrder("ipv4first");

const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const connectDB = require("./config/db");
const { verifyToken } = require("./utils/jwt");

const userRoutes = require("./routes/userRoutes");
const partnerPreferenceRoutes = require("./routes/partnerPreferenceRoutes");
const matchingRoutes = require("./routes/matchingRoutes");
const shortlistRoutes = require("./routes/shortlistRoutes");
const biodataRoutes = require("./routes/biodataRoutes");
const communicationRoutes = require("./routes/communicationRoutes");
const meetingRoutes = require("./routes/meetingRoutes");
const inquiryRoutes = require("./routes/inquiryRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const reportRoutes = require("./routes/reportRoutes");
const outcomeRoutes = require("./routes/outcomeRoutes");
const documentRoutes = require("./routes/documentRoutes");
const taskRoutes = require("./routes/taskRoutes");
const activityRoutes = require("./routes/activityRoutes");
const authRoutes = require("./routes/authRoutes");
const messageRoutes = require("./routes/messageRoutes");
const pairMessageRoutes = require("./routes/pairMessageRoutes");

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;

// ========================================
// MIDDLEWARE
// ========================================

app.use(cors());

app.use(express.json());

// ========================================
// MONGODB
// ========================================

connectDB();

// ========================================
// SOCKET.IO
// ========================================

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// ========================================
// SOCKET.IO AUTHENTICATION
// ========================================

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(
        new Error("Authentication token is required")
      );
    }

    const decoded = verifyToken(token);

    socket.user = decoded;

    next();
  } catch (error) {
    console.error(
      "Socket authentication failed:",
      error.message
    );

    next(
      new Error("Invalid or expired authentication token")
    );
  }
});

// ========================================
// SOCKET CONNECTION
// ========================================

io.on("connection", (socket) => {
  console.log(
    `Socket connected: ${socket.id} | User: ${socket.user.userId} | Role: ${socket.user.role}`
  );

  // Personal room
  // Har connected user apne userId wale room mein rahega.
  socket.join(`user:${socket.user.userId}`);

  socket.on("disconnect", (reason) => {
    console.log(
      `Socket disconnected: ${socket.id} | Reason: ${reason}`
    );
  });
});

// ========================================
// AUTH ROUTES
// ========================================

app.use("/api/auth", authRoutes);

// ========================================
// USER ROUTES
// ========================================

app.use("/api/users", userRoutes);

app.use(
  "/api/partner-preferences",
  partnerPreferenceRoutes
);

app.use("/api/matching", matchingRoutes);

app.use(
  "/api/shortlists",
  shortlistRoutes
);

app.use(
  "/api/biodatas",
  biodataRoutes
);

app.use(
  "/api/communications",
  communicationRoutes
);

app.use("/api/meetings", meetingRoutes);

app.use("/api/inquiries", inquiryRoutes);

app.use("/api/dashboard", dashboardRoutes);

app.use(
  "/api/notifications",
  notificationRoutes
);

app.use("/api/reports", reportRoutes);

app.use("/api/outcomes", outcomeRoutes);

app.use("/api/documents", documentRoutes);

app.use("/api/tasks", taskRoutes);

app.use("/api/activities", activityRoutes);

app.use("/api/messages", messageRoutes);

app.use(
  "/api/pair-messages",
  pairMessageRoutes
);

// ========================================
// TEST ROUTE
// ========================================

app.get("/", (req, res) => {
  res.json({
    message: "CRM Backend is running",
  });
});

// ========================================
// START SERVER
// ========================================

server.listen(PORT, "0.0.0.0", () => {
  console.log(
    `CRM Server running on port ${PORT}`
  );
});
