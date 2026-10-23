const Trip = require('../models/Trip');

// no GPS for this long means the driver forgot to press Stop; the next
// update then starts a new trip and the old one ends at its last GPS time
const TRIP_TIMEOUT_MS = 30 * 60 * 1000;

const SHARED_LOGIN_NAME = 'Shared driver login';

// Called on every GPS update: continue the bus's open trip, or start a new one.
const recordTripPing = async (bus, driver) => {
  const now = new Date();
  const driverId = driver ? driver._id.toString() : null;
  const open = await Trip.findOne({ bus: bus._id, endedAt: null });

  if (open) {
    const sameDriver = (open.driver ? open.driver.toString() : null) === driverId;
    const timedOut = now.getTime() - open.lastSeenAt.getTime() > TRIP_TIMEOUT_MS;
    if (sameDriver && !timedOut) {
      await Trip.updateOne({ _id: open._id }, { lastSeenAt: now });
      return;
    }
    await Trip.updateOne(
      { _id: open._id },
      { endedAt: open.lastSeenAt, endReason: timedOut ? 'timeout' : 'driverChange' }
    );
  }

  await Trip.create({
    bus: bus._id,
    busNumber: bus.busNumber,
    route: bus.route,
    driver: driver ? driver._id : null,
    driverName: driver ? driver.name : SHARED_LOGIN_NAME,
    startedAt: now,
    lastSeenAt: now
  });
};

// Close the bus's open trip, if any (driver Stop, or admin switched the bus off).
const endOpenTrip = async (busId, reason) => {
  await Trip.updateOne({ bus: busId, endedAt: null }, { endedAt: new Date(), endReason: reason });
};

module.exports = { recordTripPing, endOpenTrip, TRIP_TIMEOUT_MS };
