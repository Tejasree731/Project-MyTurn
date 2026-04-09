const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: function() { return !this.googleId; }, // Required only if not using Google OAuth
    minlength: 6
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true // Allows multiple null values for non-Google users
  },
  role: {
    type: String,
    enum: ["admin", "user"],
    default: "user"
  },
  tokens: {
    type: Number,
    default: 0
  },
  maxTokens: {
    type: Number,
    default: 10
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("User", userSchema);