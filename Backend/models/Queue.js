const mongoose = require("mongoose");

// 🔹 Queue Entry
const queueEntrySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  username: {
    type: String,
    required: true
  },
  ticketNumber: {
    type: Number,
    required: true
  },
  joinedAt: {
    type: Date,
    default: Date.now
  }
});

// 🔹 Main Queue
const queueSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },

  organization: {
    type: String,
    required: true,
    trim: true
  },

  icon: {
    type: String
  },

  color: {
    type: String
  },

  capacity: {
    type: Number,
    default: 50
  },

  nextTicket: {
    type: Number,
    default: 1
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",   // ✅ IMPORTANT FIX
    required: true
  },

  status: {
    type: String,
    enum: ["open", "closed"],
    default: "open"
  },

  entries: [queueEntrySchema]

}, { timestamps: true });

module.exports = mongoose.model("Queue", queueSchema);