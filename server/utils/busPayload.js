// Shape sent to students/admins for a bus and its latest location.
const toBusPayload = (bus, loc) => ({
  id: bus._id.toString(),
  number: bus.busNumber,
  route: bus.route,
  status: bus.status,
  coordinates: loc ? { lat: loc.latitude, lng: loc.longitude } : null,
  speedKmh: loc && Number.isFinite(loc.speedKmh) ? loc.speedKmh : null,
  updatedAt: loc ? loc.updatedAt : null
});

// Push a bus update only to students on that route and to admins.
const emitBusUpdate = (io, bus, loc) => {
  if (!io) return;
  const payload = toBusPayload(bus, loc);
  io.to(`route:${bus.route}`).to('admin').emit('busUpdate', payload);
};

module.exports = { toBusPayload, emitBusUpdate };
