const express = require("express");
const router = express.Router();

const { addDummyQueues, getQueues,joinQueue,getMyStatus,leaveQueue,completeTurn, getMyActiveQueues, getActiveBroadcasts } = require("../controllers/queueController");
const { protect } = require("../middleware/authMiddleware");

router.get("/", getQueues);
router.get("/broadcasts", protect, getActiveBroadcasts);
router.post("/dummy", protect, addDummyQueues);
router.post("/:queueId/join", protect, joinQueue);
router.get("/:queueId/status", protect, getMyStatus);
router.post("/leave", protect, leaveQueue);
router.post("/complete-turn", completeTurn);
router.get("/all-active", protect, getMyActiveQueues);
module.exports = router;