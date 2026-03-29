const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      family: 4, // 🔥 forces IPv4 (fixes SSL issues)
    });

    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error("❌ DB ERROR:", error.message);
    throw error;
  }
};

module.exports = connectDB;