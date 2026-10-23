const Admin = require('../models/Admin');
const Route = require('../models/Route');
const Bus = require('../models/Bus');
const Student = require('../models/Student');
const Location = require('../models/Location');
const Announcement = require('../models/Announcement');
const { SALT_ROUNDS, comparePassword, hashPassword, newPasswordError } = require('../utils/passwords');
const { signToken } = require('../middleware/auth');
const { sendError } = require('../utils/errors');
const { toBusPayload, emitBusUpdate } = require('../utils/busPayload');

const login = async (req, res) => {
  const { username, password } = req.body;
  try {
    const admin = await Admin.findOne({ username });
    const isValid = admin && await comparePassword(password, admin.password);
    if (isValid) {
      res.json({ success: true, token: signToken({ role: 'admin', username }) });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (err) {
    sendError(res, err);
  }
};

const addRoute = async (req, res) => {
  const { routeName } = req.body;
  try {
    const route = new Route({ routeName });
    await route.save();
    res.json(route);
  } catch (err) {
    sendError(res, err);
  }
};

const listRoutes = async (req, res) => {
  try {
    const routes = await Route.find();
    res.json(routes);
  } catch (err) {
    sendError(res, err);
  }
};

const updateRoute = async (req, res) => {
  const { id } = req.params;
  const { routeName } = req.body;
  try {
    const oldRoute = await Route.findById(id);
    if (!oldRoute) return res.status(404).json({ error: 'Route not found' });

    const route = await Route.findByIdAndUpdate(id, { routeName }, { new: true, runValidators: true });

    // buses and students reference routes by name, so carry the rename over
    if (oldRoute.routeName !== route.routeName) {
      await Bus.updateMany({ route: oldRoute.routeName }, { route: route.routeName });
      await Student.updateMany(
        { registeredRoutes: oldRoute.routeName },
        { $set: { 'registeredRoutes.$': route.routeName } }
      );
      await Announcement.updateMany({ route: oldRoute.routeName }, { route: route.routeName });
    }
    res.json(route);
  } catch (err) {
    sendError(res, err);
  }
};

const MAX_STOPS = 50;

// replace a route's stops; body: { stops: [{ name, lat, lng }, ...] } in travel order
const updateRouteStops = async (req, res) => {
  const { stops } = req.body;
  if (!Array.isArray(stops) || stops.length > MAX_STOPS) {
    return res.status(400).json({ error: `Send a list of up to ${MAX_STOPS} stops` });
  }
  const cleanStops = [];
  for (const stop of stops) {
    const name = typeof stop?.name === 'string' ? stop.name.trim() : '';
    const lat = Number(stop?.lat);
    const lng = Number(stop?.lng);
    if (!name || !Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      return res.status(400).json({ error: 'Every stop needs a name and a valid map position' });
    }
    cleanStops.push({ name, lat, lng });
  }

  try {
    const route = await Route.findByIdAndUpdate(req.params.id, { stops: cleanStops }, { new: true, runValidators: true });
    if (!route) return res.status(404).json({ error: 'Route not found' });
    res.json(route);
  } catch (err) {
    sendError(res, err);
  }
};

const deleteRoute = async (req, res) => {
  const { id } = req.params;
  try {
    const route = await Route.findById(id);
    if (!route) return res.status(404).json({ error: 'Route not found' });

    const busCount = await Bus.countDocuments({ route: route.routeName });
    if (busCount > 0) {
      return res.status(409).json({
        error: `${busCount} bus(es) still use this route. Move or delete them first.`
      });
    }

    await route.deleteOne();
    await Student.updateMany({}, { $pull: { registeredRoutes: route.routeName } });
    await Announcement.deleteMany({ route: route.routeName });
    res.json({ success: true });
  } catch (err) {
    sendError(res, err);
  }
};

const listBuses = async (req, res) => {
  try {
    const buses = await Bus.find();
    res.json(buses);
  } catch (err) {
    sendError(res, err);
  }
};

const addBus = async (req, res) => {
  const { busNumber, route } = req.body;
  try {
    const bus = new Bus({ busNumber, route });
    await bus.save();
    res.json(bus);
  } catch (err) {
    sendError(res, err);
  }
};

const updateBus = async (req, res) => {
  const { id } = req.params;
  const { busNumber, route, status } = req.body;
  // only update the fields that were sent
  const changes = {};
  if (busNumber !== undefined) changes.busNumber = busNumber;
  if (route !== undefined) changes.route = route;
  if (status !== undefined) changes.status = status;
  try {
    const bus = await Bus.findByIdAndUpdate(id, changes, { new: true, runValidators: true });
    if (!bus) return res.status(404).json({ error: 'Bus not found' });

    const loc = await Location.findOne({ busId: bus._id });
    emitBusUpdate(req.app.locals.io, bus, loc);
    res.json(bus);
  } catch (err) {
    sendError(res, err);
  }
};

const deleteBus = async (req, res) => {
  const { id } = req.params;
  try {
    const bus = await Bus.findByIdAndDelete(id);
    if (!bus) return res.status(404).json({ error: 'Bus not found' });
    await Location.deleteOne({ busId: bus._id });
    res.json({ success: true });
  } catch (err) {
    sendError(res, err);
  }
};

// optional pass end date: missing/empty -> null, invalid -> undefined
const parseValidUntil = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

const addStudent = async (req, res) => {
  const { studentId, name, password, registeredRoutes } = req.body;
  if (!studentId || !name || !password) {
    return res.status(400).json({ error: 'Student ID, name and password are required' });
  }
  const accessValidUntil = parseValidUntil(req.body.accessValidUntil);
  if (accessValidUntil === undefined) {
    return res.status(400).json({ error: 'Invalid pass end date' });
  }
  try {
    const hashedPassword = await hashPassword(password);
    const student = new Student({
      studentId,
      name,
      password: hashedPassword,
      registeredRoutes: Array.isArray(registeredRoutes) ? registeredRoutes : [],
      accessValidUntil
    });
    await student.save();
    const safeStudent = student.toObject();
    delete safeStudent.password;
    res.json(safeStudent);
  } catch (err) {
    sendError(res, err);
  }
};

const listStudents = async (req, res) => {
  try {
    const students = await Student.find().select('-password');
    res.json(students);
  } catch (err) {
    sendError(res, err);
  }
};

// body: { registeredRoutes, accessValidUntil? } – the pass end date is only changed when sent
const updateStudentRoutes = async (req, res) => {
  const { id } = req.params;
  const { registeredRoutes } = req.body;
  const changes = { registeredRoutes: Array.isArray(registeredRoutes) ? registeredRoutes : [] };
  if ('accessValidUntil' in req.body) {
    const accessValidUntil = parseValidUntil(req.body.accessValidUntil);
    if (accessValidUntil === undefined) {
      return res.status(400).json({ error: 'Invalid pass end date' });
    }
    changes.accessValidUntil = accessValidUntil;
  }
  try {
    const student = await Student.findByIdAndUpdate(id, changes, { new: true }).select('-password');
    if (student) res.json(student);
    else res.status(404).json({ error: 'Student not found' });
  } catch (err) {
    sendError(res, err);
  }
};

const MAX_IMPORT_ROWS = 500;
// bulk imports hash many passwords at once, so use the recommended minimum cost
const IMPORT_HASH_ROUNDS = Math.min(SALT_ROUNDS, 10);

// body: { students: [{ row, studentId, name, password, routes: [] }], accessValidUntil? }
// adds every valid row and reports the skipped ones with a reason
const importStudents = async (req, res) => {
  const rows = req.body.students;
  if (!Array.isArray(rows) || rows.length === 0 || rows.length > MAX_IMPORT_ROWS) {
    return res.status(400).json({ error: `Send between 1 and ${MAX_IMPORT_ROWS} students` });
  }
  const accessValidUntil = parseValidUntil(req.body.accessValidUntil);
  if (accessValidUntil === undefined) {
    return res.status(400).json({ error: 'Invalid pass end date' });
  }

  try {
    const routeNames = new Set((await Route.find({}, 'routeName')).map((r) => r.routeName));
    const ids = rows.map((r) => (typeof r?.studentId === 'string' ? r.studentId.trim() : ''));
    const existing = new Set((await Student.find({ studentId: { $in: ids } }, 'studentId')).map((s) => s.studentId));

    const seen = new Set();
    const skipped = [];
    const valid = [];
    rows.forEach((raw, index) => {
      const row = Number.isInteger(raw?.row) ? raw.row : index + 1;
      const studentId = ids[index];
      const name = typeof raw?.name === 'string' ? raw.name.trim() : '';
      const password = typeof raw?.password === 'string' ? raw.password : '';
      const routes = Array.isArray(raw?.routes)
        ? raw.routes.filter((r) => typeof r === 'string').map((r) => r.trim()).filter(Boolean)
        : [];

      const unknownRoute = routes.find((r) => !routeNames.has(r));
      let reason = null;
      if (!studentId || !name) reason = 'Missing student ID or name';
      else if (existing.has(studentId)) reason = 'Student ID already exists';
      else if (seen.has(studentId)) reason = 'Student ID repeated in file';
      else if (unknownRoute) reason = `Unknown route: ${unknownRoute}`;
      else reason = newPasswordError(password, 6);

      if (reason) {
        skipped.push({ row, studentId, reason });
      } else {
        seen.add(studentId);
        valid.push({ studentId, name, password, registeredRoutes: routes });
      }
    });

    const docs = [];
    for (const s of valid) {
      docs.push({ ...s, password: await hashPassword(s.password, IMPORT_HASH_ROUNDS), accessValidUntil });
    }
    if (docs.length) await Student.insertMany(docs);

    res.json({ added: docs.length, skipped });
  } catch (err) {
    sendError(res, err);
  }
};

// latest known position of every bus that has shared a location
const viewLocations = async (req, res) => {
  try {
    const locs = await Location.find().populate('busId');
    res.json(locs.filter((loc) => loc.busId).map((loc) => toBusPayload(loc.busId, loc)));
  } catch (err) {
    sendError(res, err);
  }
};

/* ---------------- ANNOUNCEMENTS ---------------- */
const MAX_ANNOUNCEMENT_DAYS = 7;

// students on the route get it live; "all routes" goes to every student
const announcementRoom = (route) => (route ? `route:${route}` : 'students');

const listAnnouncements = async (req, res) => {
  try {
    const items = await Announcement.find({ expiresAt: { $gt: new Date() } }).sort({ createdAt: -1 });
    res.json(items.map((a) => a.toPayload()));
  } catch (err) {
    sendError(res, err);
  }
};

// body: { message, route (name or null for all), expiresAt (ISO date) }
const addAnnouncement = async (req, res) => {
  const message = typeof req.body.message === 'string' ? req.body.message.trim() : '';
  const route = req.body.route || null;
  const expiresAt = new Date(req.body.expiresAt);
  const now = Date.now();

  if (!message || message.length > 280) {
    return res.status(400).json({ error: 'Message must be 1 to 280 characters' });
  }
  if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= now ||
      expiresAt.getTime() > now + MAX_ANNOUNCEMENT_DAYS * 24 * 60 * 60 * 1000) {
    return res.status(400).json({ error: `Expiry must be in the next ${MAX_ANNOUNCEMENT_DAYS} days` });
  }

  try {
    if (route && !(await Route.exists({ routeName: route }))) {
      return res.status(400).json({ error: 'Route not found' });
    }
    const announcement = await Announcement.create({ message, route, expiresAt });
    const io = req.app.locals.io;
    if (io) io.to(announcementRoom(route)).emit('announcement', announcement.toPayload());
    res.json(announcement.toPayload());
  } catch (err) {
    sendError(res, err);
  }
};

const deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndDelete(req.params.id);
    if (!announcement) return res.status(404).json({ error: 'Announcement not found' });
    const io = req.app.locals.io;
    if (io) io.to(announcementRoom(announcement.route)).emit('announcementDeleted', { id: announcement._id.toString() });
    res.json({ success: true });
  } catch (err) {
    sendError(res, err);
  }
};

// admin changes their own password
const changeOwnPassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const ruleError = newPasswordError(newPassword, 8);
  if (ruleError) return res.status(400).json({ error: ruleError });

  try {
    const admin = await Admin.findOne({ username: req.user.username });
    if (!admin || !(await comparePassword(currentPassword, admin.password))) {
      return res.status(401).json({ error: 'Current password is wrong' });
    }
    admin.password = await hashPassword(newPassword);
    await admin.save();
    res.json({ success: true });
  } catch (err) {
    sendError(res, err);
  }
};

// admin sets a new password for a student; the student's existing logins stop working
const resetStudentPassword = async (req, res) => {
  const { newPassword } = req.body;
  const ruleError = newPasswordError(newPassword, 6);
  if (ruleError) return res.status(400).json({ error: ruleError });

  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ error: 'Student not found' });
    student.password = await hashPassword(newPassword);
    student.passwordChangedAt = new Date();
    await student.save();
    res.json({ success: true });
  } catch (err) {
    sendError(res, err);
  }
};

module.exports = {
  login,
  changeOwnPassword,
  resetStudentPassword,
  listAnnouncements,
  addAnnouncement,
  deleteAnnouncement,
  addRoute,
  updateRoute,
  updateRouteStops,
  deleteRoute,
  listRoutes,
  addBus,
  updateBus,
  deleteBus,
  listBuses,
  addStudent,
  listStudents,
  updateStudentRoutes,
  importStudents,
  viewLocations
};
