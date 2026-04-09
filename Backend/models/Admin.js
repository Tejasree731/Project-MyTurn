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
    required: function() { return !this.googleId; } // Required only if not using Google OAuth
  },
  organizationName: {
    type: String,
    required: true
  },
  googleId: {
    type: String
  },
  role: {
    type: String,
    enum: ["superadmin", "admin", "staff"],
    default: "admin"
  },
  ownedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
    default: null
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