const Bus = require('../models/Bus');
const Location = require('../models/Location');
const { comparePassword, isBcryptHash } = require('../utils/passwords');

const login = async (req, res) => {
  const { password } = req.body;
  const configuredHash = process.env.DRIVER_PASSWORD_HASH;
  const configuredPlain = process.env.DRIVER_PASSWORD;

  try {
    let isValid = false;

    // Prefer hash-based auth when present. If a plain value was accidentally
    // placed in DRIVER_PASSWORD_HASH, fall back to plain comparison.
    if (configuredHash) {
      if (isBcryptHash(configuredHash)) {
        isValid = await comparePassword(password, configuredHash);
      } else {
        isValid = password === configuredHash;
      }
    } else if (configuredPlain) {
      isValid = password === configuredPlain;
    } else {
      // Dev fallback to avoid lockout when env is missing.
      isValid = password === 'driver123';
    }

    if (isValid) {
      res.json({ success: true });
    } else {
      res.status(401).json({ error: 'Invalid driver password' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// driver will post location for a particular bus
const shareLocation = async (req, res) => {
  const { busId } = req.params;
  const { latitude, longitude } = req.body;
  try {
    // the front-end currently sends a simple bus identifier (e.g. "R1")
    // but our Bus model uses a Mongo ObjectId as _id, so look up by
    // busNumber when the value isn't a valid ObjectId.  This keeps
    // the existing admin paths working as well as allowing numeric
    // ids in the future.
    let bus;
    const mongoose = require('mongoose');
    if (mongoose.Types.ObjectId.isValid(busId)) {
      bus = await Bus.findById(busId);
    }
    if (!bus) {
      // fall back to busNumber field
      bus = await Bus.findOne({ busNumber: busId });
    }
    if (!bus) {
      return res.status(404).json({ error: 'Bus not found' });
    }

    const loc = await Location.findOneAndUpdate(
      { busId: bus._id },
      { latitude, longitude, updatedAt: Date.now() },
      { upsert: true, new: true }
    );
    // emit updated location to any listening clients
    const io = req.app.locals.io;
    if (io) {
      // Backward-compatible event for existing clients.
      io.emit('locationUpdate', loc);

      // Canonical realtime payload used by student tracking map.
      const updatedBuses = await Location.find()
        .populate('busId')
        .then((locations) =>
          locations
            .filter((item) => item.busId)
            .map((item) => ({
              id: item.busId._id.toString(),
              number: item.busId.busNumber,
              route: item.busId.route,
              status: item.busId.status,
              coordinates: {
                lat: item.latitude,
                lng: item.longitude
              }
            }))
        );

      io.emit('busUpdates', updatedBuses);
    }
    res.json(loc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { login, shareLocation };
