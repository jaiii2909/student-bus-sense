const mongoose = require('mongoose');

// One run of a bus, from the driver's Start to Stop. Bus, route and driver
// name are copied in so the log stays readable if those change later.
const tripSchema = new mongoose.Schema({
  bus: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus', required: true },
  busNumber: { type: String, required: true },
  route: { type: String, required: true },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', default: null },
  driverName: { type: String, required: true },
  startedAt: { type: Date, required: true },
  lastSeenAt: { type: Date, required: true },
  // null while the trip is running
  endedAt: { type: Date, default: null },
  // how it ended: driver pressed Stop, admin switched the bus off, or no GPS for a while
  endReason: { type: String, enum: ['stopped', 'admin', 'timeout', 'driverChange'], default: null }
});

tripSchema.index({ bus: 1, endedAt: 1 });
tripSchema.index({ startedAt: -1 });

module.exports = mongoose.model('Trip', tripSchema);
