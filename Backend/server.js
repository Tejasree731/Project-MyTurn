// server.js
require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");
const cron = require("node-cron");
const app = require("./app");
const connectDB = require("./config/db");
const Queue = require("./models/Queue");

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["https://project-myturn-frontend.onrender.com", "http://localhost:3000"],
    methods: ["GET", "POST"]
  }
});

// Attach io to app for use in controllers
app.set("io", io);

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("joinQueueRoom", (queueId) => {
    socket.join(queueId);
    console.log(`User joined room: ${queueId}`);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

// Daily Reset Cron Job (Runs at 00:00 every day)
cron.schedule("0 0 * * *", async () => {
  try {
    console.log("Running daily queue reset...");
    await Queue.updateMany({}, { entries: [], nextTicket: 1 });
    io.emit("queueReset");
    console.log("All queues have been reset.");
  } catch (err) {
    console.error("Error during daily reset:", err);
  }
});

// Connect DB
const startServer = async () => {
  try {
    await connectDB();

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

  } catch (err) {
    console.error(err);
  }
};

startServer();
