const express = require("express");
const router = express.Router();
const { authAdmin } = require("../middleware/authMiddleware");
const {
  registerAdmin,
  loginAdmin,
  createQueue,
  getAllQueues,
  getQueueById,
  updateQueue,
  deleteQueue,
  toggleQueueStatus,
  getQueueUsers,
  removeUserFromQueue,
//   reorderQueue,
  clearQueue,
  getAdminProfile,
  updateAdminProfile,
  getDashboardStats
} = require("../controllers/adminController");

router.post("/register", registerAdmin);
router.post("/login", loginAdmin);

router.use(authAdmin);

// 🔐 Profile
router.get("/profile", getAdminProfile);
router.put("/profile", updateAdminProfile);


// 📋 Queue
router.post("/queue", createQueue);
router.get("/queues", getAllQueues);
router.get("/queue/:id", getQueueById);
router.put("/queue/:id", updateQueue);
router.delete("/queue/:id", deleteQueue);
router.patch("/queue/:id/toggle", toggleQueueStatus);
router.delete("/queue/:id/clear", clearQueue);


// 👥 Users
router.get("/queue/:id/users", getQueueUsers);
router.delete("/queue/:id/user/:userId", removeUserFromQueue);
// router.patch("/queue/reorder", reorderQueue);


// 📊 Dashboard
router.get("/dashboard", getDashboardStats);

module.exports = router;