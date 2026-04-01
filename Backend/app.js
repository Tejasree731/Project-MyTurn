// app.js
const express = require("express");
const cors = require("cors");

const app = express();

// Middleware
const allowedOrigins = [
  'https://project-myturn-frontend.onrender.com',
  'http://localhost:3000'
];

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      var msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Log requests to help debug
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url} - Origin: ${req.headers.origin}`);
  next();
});

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