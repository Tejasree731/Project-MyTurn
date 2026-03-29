// db.js
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
  dbName: "test1"
});
    console.log("MongoDB Connected");
  } catch (error) {
    console.log("DB Error:", error);
    process.exit(1);
  }
};

module.exports = connectDB;