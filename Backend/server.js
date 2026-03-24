require("dotenv").config();
const connectDB = require("./config/db");
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;


// Middleware
app.use(cors());
app.use(express.json());

const startServer = async () => {
  try {
    console.log("🔄 Connecting to DB...");
    
    await connectDB(); // ✅ wait for DB

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

  } catch (err) {
    console.error("❌ Error starting server:", err.message);
  }
};



// Test route
app.get("/", (req, res) => {
  res.send("MyTurn API is running...");
});

const adminRoutes = require("./routes/adminRoutes");
app.use("/api/admin", adminRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});


startServer();