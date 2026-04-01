const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  queueId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Queue",
    required: true
  },
  razorpayOrderId: {
    type: String,
    required: true
  },
  razorpayPaymentId: {
    type: String
  },
  razorpaySignature: {
    type: String
  },
  amount: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    default: 1
  },
  currency: {
    type: String,
    default: "INR"
  },
  status: {
    type: String,
    enum: ["created", "paid", "failed"],
    default: "created"
  }
}, { timestamps: true });

module.exports = mongoose.model("Payment", paymentSchema);
