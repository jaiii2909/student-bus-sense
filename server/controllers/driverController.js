const mongoose = require('mongoose');
const Bus = require('../models/Bus');
const Location = require('../models/Location');
const Driver = require('../models/Driver');
const { comparePassword, isBcryptHash } = require('../utils/passwords');
const { signToken, isTokenOutdated } = require('../middleware/auth');
const { sendError } = require('../utils/errors');
const { emitBusUpdate } = require('../utils/busPayload');
const { recordTripPing, endOpenTrip } = require('../utils/trips');

// Drivers log in with their own username + password. The old shared password
// (env DRIVER_PASSWORD_HASH) only works until the first driver account is created.
const login = async (req, res) => {
  const { password } = req.body;
  const username = typeof req.body.username === 'string' ? req.body.username.trim().toLowerCase() : '';

  try {
    if (username) {
      const driver = await Driver.findOne({ username });
      const isValid = driver && driver.active && await comparePassword(password, driver.password);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }
      return res.json({
        success: true,
        name: driver.name,
        token: signToken({ role: 'driver', driverId: driver._id.toString(), name: driver.name })
      });
    }

    if (await Driver.exists({})) {
      return res.status(401).json({ error: 'Please log in with your driver username and password' });
    }
    return sharedPasswordLogin(password, res);
  } catch (err) {
    sendError(res, err);
  }
};

const sharedPasswordLogin = async (password, res) => {
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

// Middleware for driver actions: the account must still be active and the token
// newer than its last password reset. Shared-login tokens stop working once
// driver accounts exist. Sets req.driver (null for the shared login).
const requireActiveDriver = async (req, res, next) => {
  try {
    if (!req.user.driverId) {
      if (await Driver.exists({})) return res.status(401).json({ error: 'Please log in again' });
      req.driver = null;
      return next();
    }
    const driver = await Driver.findById(req.user.driverId);
    if (!driver || !driver.active || isTokenOutdated(req.user, driver.passwordChangedAt)) {
      return res.status(401).json({ error: 'Please log in again' });
    }
    req.driver = driver;
    next();
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
  // optional; phones without GPS speed send nothing, and odd values are ignored
  const rawSpeed = req.body.speedKmh;
  const speedKmh = rawSpeed === null || rawSpeed === undefined ? null : Number(rawSpeed);
  const validSpeed = Number.isFinite(speedKmh) && speedKmh >= 0 && speedKmh <= 150 ? speedKmh : null;

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
      { latitude, longitude, speedKmh: validSpeed, updatedAt: Date.now() },
      { upsert: true, new: true }
    );
    await recordTripPing(bus, req.driver);
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
    await endOpenTrip(bus._id, 'stopped');
    const loc = await Location.findOne({ busId: bus._id });
    emitBusUpdate(req.app.locals.io, bus, loc);
    res.json({ success: true });
  } catch (err) {
    sendError(res, err);
  }
};

module.exports = { login, requireActiveDriver, shareLocation, stopSharing };
