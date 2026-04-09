const mongoose = require('mongoose');

const broadcastSchema = new mongoose.Schema({
    message: { type: String, required: true },
    type: { type: String, enum: ['info', 'warning', 'urgent'], default: 'info' },
    active: { type: Boolean, default: true },
    queueId: { type: mongoose.Schema.Types.ObjectId, ref: 'Queue', required: false }, // null means global
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Broadcast', broadcastSchema);
