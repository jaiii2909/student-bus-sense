const Admin = require('../models/Admin');
const Route = require('../models/Route');
const Bus = require('../models/Bus');
const Student = require('../models/Student');
const Location = require('../models/Location');
const { comparePassword, hashPassword } = require('../utils/passwords');
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
    }
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

const addStudent = async (req, res) => {
  const { studentId, name, password, registeredRoutes } = req.body;
  if (!studentId || !name || !password) {
    return res.status(400).json({ error: 'Student ID, name and password are required' });
  }
  try {
    const hashedPassword = await hashPassword(password);
    const student = new Student({
      studentId,
      name,
      password: hashedPassword,
      registeredRoutes: Array.isArray(registeredRoutes) ? registeredRoutes : []
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

const updateStudentRoutes = async (req, res) => {
  const { id } = req.params;
  const { registeredRoutes } = req.body;
  try {
    const student = await Student.findByIdAndUpdate(
      id,
      { registeredRoutes: Array.isArray(registeredRoutes) ? registeredRoutes : [] },
      { new: true }
    ).select('-password');
    if (student) res.json(student);
    else res.status(404).json({ error: 'Student not found' });
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

module.exports = {
  login,
  addRoute,
  updateRoute,
  deleteRoute,
  listRoutes,
  addBus,
  updateBus,
  deleteBus,
  listBuses,
  addStudent,
  listStudents,
  updateStudentRoutes,
  viewLocations
};
