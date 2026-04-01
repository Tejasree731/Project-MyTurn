const Razorpay = require("razorpay");
const crypto = require("crypto");
const Queue = require("../models/Queue");
const User = require("../models/User");
const Payment = require("../models/Payment");

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Helper: Get start of today (midnight)
const getStartOfToday = () => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
};

// 🔹 Create Razorpay Order
exports.createOrder = async (req, res) => {
  try {
    const { queueId, quantity = 1 } = req.body;
    
    // Parse quantity
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty < 1 || qty > 5) {
      return res.status(400).json({ message: "Invalid quantity. You can buy up to 5 tokens at once." });
    }

    // 1. Find user
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 2. Find queue and validate
    const queue = await Queue.findById(queueId);
    if (!queue) {
      return res.status(404).json({ message: "Queue not found" });
    }

    if (queue.status !== "open") {
      return res.status(400).json({ message: "Queue is closed" });
    }

    if (queue.entries.length + qty > queue.capacity) {
      return res.status(400).json({ message: `Queue only has ${queue.capacity - queue.entries.length} spots left.` });
    }

    // 3. Check daily token limit for THIS queue (5 per user per queue per day max)
    const startOfToday = getStartOfToday();
    
    // Sum the *quantity* of all payments today (not just count documents)
    const paymentsToday = await Payment.find({
      userId: req.user._id,
      queueId: queueId,
      status: "paid",
      createdAt: { $gte: startOfToday }
    });
    
    const todayTokensForQueue = paymentsToday.reduce((sum, p) => sum + (p.quantity || 1), 0);

    if (todayTokensForQueue + qty > 5) {
      return res.status(400).json({
        message: `Daily limit reached! You have ${5 - todayTokensForQueue} tokens left for this queue today.`
      });
    }

    // 4. Create Razorpay order (₹5 * qty)
    const totalAmount = 500 * qty; // paise amount
    const options = {
      amount: totalAmount,
      currency: "INR",
      receipt: `rcpt_${queueId.toString().slice(-6)}_${Date.now()}`,
      notes: {
        userId: req.user._id.toString(),
        queueId: queueId,
        username: req.user.username,
        quantity: qty
      }
    };

    const order = await razorpay.orders.create(options);

    // 5. Save payment record with "created" status
    await Payment.create({
      userId: req.user._id,
      queueId,
      razorpayOrderId: order.id,
      amount: totalAmount,
      quantity: qty,
      status: "created"
    });

    // 6. Return order details
    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      queueName: queue.name,
      userName: req.user.username,
      userEmail: req.user.email,
      quantity: qty
    });

  } catch (error) {
    console.error("Create order error:", error);
    res.status(500).json({ message: "Failed to create payment order" });
  }
};

// 🔹 Verify Payment & Join Queue
exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      queueId
    } = req.body;

    // 1. Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      await Payment.findOneAndUpdate(
        { razorpayOrderId: razorpay_order_id },
        { status: "failed" }
      );
      return res.status(400).json({ message: "Payment verification failed" });
    }

    // Fetch the payment record to know the quantity
    const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id });
    if (!payment) {
        return res.status(404).json({ message: "Order not found" });
    }
    const qty = payment.quantity || 1;

    // 2. Update payment record
    await Payment.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id },
      {
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        status: "paid"
      }
    );

    // 3. Join the queue
    const queue = await Queue.findById(queueId);
    if (!queue) {
      return res.status(404).json({ message: "Queue not found" });
    }
    
    // We got rid of the alreadyJoined check so they can add more tickets dynamically.
    const assignedTickets = [];
    
    for (let i = 0; i < qty; i++) {
        const ticketNumber = queue.nextTicket;
        let displayName = req.user.username;
        if (qty > 1) {
             displayName = `${req.user.username} (${i + 1}/${qty})`;
        }
        
        queue.entries.push({
          userId: req.user._id,
          username: displayName,
          ticketNumber
        });
        
        assignedTickets.push(ticketNumber);
        queue.nextTicket += 1;
    }

    await queue.save();

    // 4. Increment user's token count
    await User.findByIdAndUpdate(req.user._id, { $inc: { tokens: qty } });

    res.json({
      success: true,
      message: "Payment verified & joined queue successfully",
      tickets: assignedTickets,
      transactionId: razorpay_payment_id,
      quantity: qty,
      amount: payment.amount,
      queueName: queue.name
    });

  } catch (error) {
    console.error("Verify payment error:", error);
    res.status(500).json({ message: "Payment verification failed" });
  }
};

// 🔹 Get user's active token global config
exports.getMyTokens = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("tokens maxTokens");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const startOfToday = getStartOfToday();
    const paymentsToday = await Payment.find({
      userId: req.user._id,
      status: "paid",
      createdAt: { $gte: startOfToday }
    });
    
    // Summing by quantity
    const todayTokensTotal = paymentsToday.reduce((sum, p) => sum + (p.quantity || 1), 0);

    res.json({
      tokens: todayTokensTotal,
      maxTokens: 5,   // Updated visual cap
      activeTokens: user.tokens
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// 🔹 Get daily usage per queue
exports.getMyDailyUsage = async (req, res) => {
  try {
    const startOfToday = getStartOfToday();

    const usage = await Payment.aggregate([
      {
        $match: {
          userId: req.user._id,
          status: "paid",
          createdAt: { $gte: startOfToday }
        }
      },
      {
        $group: {
          _id: "$queueId",
          count: { $sum: "$quantity" } 
        }
      }
    ]);

    res.json(usage);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// 🔹 Get payment history
exports.getPaymentHistory = async (req, res) => {
  try {
    const payments = await Payment.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate("queueId", "name organization");

    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
