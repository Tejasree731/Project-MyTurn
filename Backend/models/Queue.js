const mongoose = require("mongoose");

const queueSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },

  organization: {
    type: String,
    required: true
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
    required: true
  },

  users: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  ],

  maxSize: {
    type: Number,
    default: 50
  },

  status: {
    type: String,
    enum: ["open", "closed"],
    default: "open"
  }

}, { timestamps: true });

module.exports = mongoose.model("Queue", queueSchema);