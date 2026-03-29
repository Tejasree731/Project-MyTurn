const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  organizationName: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ["superadmin", "admin"],
    default: "admin"
  },
  queues: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Queue"
    }
  ],
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model("Admin", adminSchema);