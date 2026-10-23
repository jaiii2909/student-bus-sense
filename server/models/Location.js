const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  busId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus', required: true, unique: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  // speed reported by the driver's phone GPS, if available (used for ETA)
  speedKmh: { type: Number, default: null },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Location', locationSchema);
