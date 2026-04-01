const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  createOrder,
  verifyPayment,
  getMyTokens,
  getMyDailyUsage,
  getPaymentHistory
} = require("../controllers/paymentController");

// All routes are protected (user must be logged in)
router.post("/create-order", protect, createOrder);
router.post("/verify", protect, verifyPayment);
router.get("/my-tokens", protect, getMyTokens);
router.get("/daily-usage", protect, getMyDailyUsage);
router.get("/history", protect, getPaymentHistory);

module.exports = router;
