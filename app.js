// app.js
const express = require("express");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.send("MyTurn API running");
});

const authRoutes = require("./Backend/routes/authRoutes");
app.use("/api/auth", authRoutes);

const queueRoutes = require("./Backend/routes/queueRoutes");
app.use("/api/queues", queueRoutes);

const adminRoutes = require("./Backend/routes/adminRoutes");
app.use("/api/admin", adminRoutes);

const paymentRoutes = require("./Backend/routes/paymentRoutes");
app.use("/api/payment", paymentRoutes);

const { protect, adminOnly } = require("./middleware/authMiddleware");

// Protected route
app.get("/api/protected", protect, (req, res) => {
  res.json({ message: "Protected route working", user: req.user });
});



module.exports = app;