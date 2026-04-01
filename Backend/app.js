// app.js
const express = require("express");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors({
  origin: true, // This allows any origin that sends a request, which is safe for initial testing
  credentials: true
}));
app.use(express.json());

// Test and Health routes
app.get("/", (req, res) => {
  res.send("MyTurn API running");
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", uptime: process.uptime() });
});

const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);

const queueRoutes = require("./routes/queueRoutes");
app.use("/api/queues", queueRoutes);

const adminRoutes = require("./routes/adminRoutes");
app.use("/api/admin", adminRoutes);

const paymentRoutes = require("./routes/paymentRoutes");
app.use("/api/payment", paymentRoutes);

const { protect, adminOnly } = require("./middleware/authMiddleware");

// Protected route
app.get("/api/protected", protect, (req, res) => {
  res.json({ message: "Protected route working", user: req.user });
});



module.exports = app;