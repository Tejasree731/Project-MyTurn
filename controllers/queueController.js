const mongoose = require("mongoose");
const Queue = require("../models/Queue");

exports.addDummyQueues = async (req, res) => {
  try {
    const dummyQueues = [
      {
        name: "Hospital OPD",
        organization: "City Hospital",
        icon: "🏥",
        color: "hsl(200, 70%, 50%)",
        capacity: 50,
        nextTicket: 3,
        status: "open",
        createdBy: req.user.id,
        entries: [
          {
            userId: req.user.id,
            username: "rahul",
            ticketNumber: 1
          },
          {
            userId: req.user.id,
            username: "anil",
            ticketNumber: 2
          }
        ]
      },
      {
        name: "Bank Counter",
        organization: "SBI Bank",
        icon: "🏦",
        color: "hsl(120, 60%, 45%)",
        capacity: 30,
        nextTicket: 2,
        status: "open",
        createdBy: req.user.id,
        entries: [
          {
            userId: req.user.id,
            username: "sneha",
            ticketNumber: 1
          }
        ]
      }
    ];

    await Queue.insertMany(dummyQueues);

    res.json({ message: "Dummy queues added" });

  } catch (error) {
    res.status(500).json({ message: "Error adding dummy data" });
  }
};

exports.getQueues = async (req, res) => {
  try {
    const queues = await Queue.find({ status: "open" });

    res.json(queues);

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

//join
exports.joinQueue = async (req, res) => {
  try {
    const { queueId } = req.body;

    const queue = await Queue.findById(queueId);

    if (!queue) {
      return res.status(404).json({ message: "Queue not found" });
    }

    // Check if open
    if (queue.status !== "open") {
      return res.status(400).json({ message: "Queue is closed" });
    }

    // Check capacity
    if (queue.entries.length >= queue.capacity) {
      return res.status(400).json({ message: "Queue is full" });
    }

    // Check already joined
    const alreadyJoined = queue.entries.find(
  (entry) => entry.userId.equals(req.user._id)
);

    if (alreadyJoined) {
      return res.status(400).json({ message: "Already in queue" });
    }

    // Assign ticket
    const ticketNumber = queue.nextTicket;

    // Add entry
    queue.entries.push({
      userId: req.user._id,
      username: req.user.username,
      ticketNumber
    });

    // Increment ticket
    queue.nextTicket += 1;

    await queue.save();

    res.json({
      message: "Joined queue successfully",
      ticketNumber
    });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};


exports.getMyStatus = async (req, res) => {
  try {
    const { queueId } = req.params;

    // ✅ 1. Validate queueId
    if (!mongoose.Types.ObjectId.isValid(queueId)) {
      return res.status(400).json({ message: "Invalid queue ID" });
    }

    // ✅ 2. Find queue
    const queue = await Queue.findById(queueId);

    if (!queue) {
      return res.status(404).json({ message: "Queue not found" });
    }

    // ✅ 3. Find user in queue
    const index = queue.entries.findIndex(entry =>
      entry.userId.equals(req.user._id)
    );

    if (index === -1) {
      return res.status(404).json({ message: "You are not in this queue" });
    }

    const myEntry = queue.entries[index];

    // ✅ 4. Send response
    res.json({
      ticketNumber: myEntry.ticketNumber,
      position: index + 1,
      peopleAhead: index
    });

  } catch (error) {
    console.error(error); // optional for debugging
    res.status(500).json({ message: "Server error" });
  }
};

exports.leaveQueue = async (req, res) => {
  try {
    const { queueId } = req.body;

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(queueId)) {
      return res.status(400).json({ message: "Invalid queue ID" });
    }

    const queue = await Queue.findById(queueId);

    if (!queue) {
      return res.status(404).json({ message: "Queue not found" });
    }

    // Find user index
    const index = queue.entries.findIndex(entry =>
      entry.userId.equals(req.user._id)
    );

    if (index === -1) {
      return res.status(404).json({ message: "You are not in this queue" });
    }

    // Remove user
    queue.entries.splice(index, 1);

    await queue.save();

    res.json({ message: "Left queue successfully" });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};