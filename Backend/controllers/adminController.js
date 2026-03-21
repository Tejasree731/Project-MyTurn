const Admin = require("../models/Admin");
const Queue = require("../models/Queue");

const createQueue = async (req, res) => {
  try {
    const { name, maxSize } = req.body;

    // get organization from admin
    const admin = await Admin.findById(req.adminId);

    const queue = new Queue({
      name,
      organization: admin.organizationName,
      maxSize,
      createdBy: req.adminId
    });

    await queue.save();

    await Admin.findByIdAndUpdate(req.adminId, {
      $push: { queues: queue._id }
    });

    res.status(201).json(queue);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getAllQueues = async (req, res) => {
  try {
    const queues = await Queue.find({ createdBy: req.adminId });
    res.json(queues);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateQueue = async (req, res) => {
  try {
    const queue = await Queue.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(queue);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteQueue = async (req, res) => {
  try {
    await Queue.findByIdAndDelete(req.params.id);

    // also remove from admin
    await Admin.findByIdAndUpdate(req.adminId, {
      $pull: { queues: req.params.id }
    });

    res.json({ message: "Queue deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getQueueUsers = async (req, res) => {
  try {
    const queue = await Queue.findById(req.params.id).populate("users");
    res.json(queue.users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const removeUserFromQueue = async (req, res) => {
  try {
    const { id, userId } = req.params;

    await Queue.findByIdAndUpdate(id, {
      $pull: { users: userId }
    });

    res.json({ message: "User removed from queue" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.adminId).select("-password");
    res.json(admin);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateAdminProfile = async (req, res) => {
  try {
    const updatedAdmin = await Admin.findByIdAndUpdate(
      req.adminId,
      req.body,
      { new: true }
    ).select("-password");

    res.json(updatedAdmin);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getQueueById = async (req, res) => {
  try {
    const queue = await Queue.findById(req.params.id)
      .populate("users", "name email");

    res.json(queue);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const toggleQueueStatus = async (req, res) => {
  try {
    const queue = await Queue.findById(req.params.id);

    queue.status = queue.status === "open" ? "closed" : "open";

    await queue.save();

    res.json(queue);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const reorderQueue = async (req, res) => {
  try {
    const { queueId, userId, direction } = req.body;

    const queue = await Queue.findById(queueId);

    const index = queue.users.indexOf(userId);

    if (index === -1) {
      return res.status(404).json({ message: "User not in queue" });
    }

    if (direction === "up" && index > 0) {
      [queue.users[index], queue.users[index - 1]] =
      [queue.users[index - 1], queue.users[index]];
    }

    if (direction === "down" && index < queue.users.length - 1) {
      [queue.users[index], queue.users[index + 1]] =
      [queue.users[index + 1], queue.users[index]];
    }

    await queue.save();

    res.json(queue.users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const clearQueue = async (req, res) => {
  try {
    await Queue.findByIdAndUpdate(req.params.id, {
      users: []
    });

    res.json({ message: "Queue cleared" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const queues = await Queue.find({ createdBy: req.adminId });

    const totalQueues = queues.length;

    const activeQueues = queues.filter(q => q.status === "open").length;

    let totalUsers = 0;
    queues.forEach(q => totalUsers += q.users.length);

    res.json({
      totalQueues,
      activeQueues,
      totalUsers
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  // Profile
  getAdminProfile,
  updateAdminProfile,

  // Queue
  createQueue,
  getAllQueues,
  getQueueById,
  updateQueue,
  deleteQueue,
  toggleQueueStatus,
  clearQueue,

  // Users
  getQueueUsers,
  removeUserFromQueue,
  reorderQueue,

  // Dashboard
  getDashboardStats
};