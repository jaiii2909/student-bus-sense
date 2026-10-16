const mongoose = require('mongoose');
const Bus = require('../models/Bus');
const Location = require('../models/Location');
const { comparePassword, isBcryptHash } = require('../utils/passwords');
const { signToken } = require('../middleware/auth');
const { sendError } = require('../utils/errors');
const { emitBusUpdate } = require('../utils/busPayload');

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
    } else if (process.env.NODE_ENV !== 'production') {
      // Dev fallback to avoid lockout when env is missing.
      isValid = password === 'driver123';
    } else {
      console.error('DRIVER_PASSWORD_HASH / DRIVER_PASSWORD is not set');
    }

    if (isValid) {
      res.json({ success: true, token: signToken({ role: 'driver' }) });
    } else {
      res.status(401).json({ error: 'Invalid driver password' });
    }
  } catch (err) {
    sendError(res, err);
  }
};

// the front-end sends the bus number (e.g. "R1"); ObjectIds also work
const findBus = async (busId) => {
  let bus = null;
  if (mongoose.Types.ObjectId.isValid(busId)) {
    bus = await Bus.findById(busId);
  }
  return bus || Bus.findOne({ busNumber: busId });
};

// driver posts location for a particular bus; this also marks the bus as running
const shareLocation = async (req, res) => {
  const { busId } = req.params;
  const latitude = Number(req.body.latitude);
  const longitude = Number(req.body.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return res.status(400).json({ error: 'Invalid coordinates' });
  }

  try {
    const bus = await findBus(busId);
    if (!bus) {
      return res.status(404).json({ error: 'Bus not found' });
    }
    if (bus.status !== 'active') {
      bus.status = 'active';
      await bus.save();
    }

    const loc = await Location.findOneAndUpdate(
      { busId: bus._id },
      { latitude, longitude, updatedAt: Date.now() },
      { upsert: true, new: true }
    );
    emitBusUpdate(req.app.locals.io, bus, loc);
    res.json(loc);
  } catch (err) {
    sendError(res, err);
  }
};

// driver stopped sharing: mark the bus as not running
const stopSharing = async (req, res) => {
  try {
    const bus = await findBus(req.params.busId);
    if (!bus) {
      return res.status(404).json({ error: 'Bus not found' });
    }
    bus.status = 'inactive';
    await bus.save();
    const loc = await Location.findOne({ busId: bus._id });
    emitBusUpdate(req.app.locals.io, bus, loc);
    res.json({ success: true });
  } catch (err) {
    sendError(res, err);
  }
};

module.exports = { login, shareLocation, stopSharing };
