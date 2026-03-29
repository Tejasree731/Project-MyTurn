const express = require("express");
const router = express.Router();

const { addDummyQueues, getQueues,joinQueue,getMyStatus,leaveQueue } = require("../controllers/queueController");
const { protect } = require("../middleware/authMiddleware");

router.get("/", getQueues);
router.post("/dummy", protect, addDummyQueues);
router.post("/:queueId/join", protect, joinQueue);
router.get("/:queueId/status", protect, getMyStatus);
router.post("/leave", protect, leaveQueue);
module.exports = router;