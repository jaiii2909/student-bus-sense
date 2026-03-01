const Admin = require('../models/Admin');
const Route = require('../models/Route');
const Bus = require('../models/Bus');
const Student = require('../models/Student');

// simple password compare; in real app use hashing
const login = async (req, res) => {
  const { username, password } = req.body;
  try {
    const admin = await Admin.findOne({ username });
    if (admin && admin.password === password) {
      res.json({ success: true });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const addRoute = async (req, res) => {
  const { routeName } = req.body;
  try {
    const route = new Route({ routeName });
    await route.save();
    res.json(route);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const listRoutes = async (req, res) => {
  try {
    const routes = await Route.find();
    res.json(routes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateRoute = async (req, res) => {
  const { id } = req.params;
  const { routeName } = req.body;
  try {
    const route = await Route.findByIdAndUpdate(id, { routeName }, { new: true });
    if (route) res.json(route);
    else res.status(404).json({ error: 'Route not found' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteRoute = async (req, res) => {
  const { id } = req.params;
  try {
    const route = await Route.findByIdAndDelete(id);
    if (route) res.json({ success: true });
    else res.status(404).json({ error: 'Route not found' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
const listBuses = async (req, res) => {
  try {
    const buses = await Bus.find();
    res.json(buses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const addBus = async (req, res) => {
  const { busNumber, route } = req.body;
  try {
    const bus = new Bus({ busNumber, route });
    await bus.save();
    res.json(bus);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateBus = async (req, res) => {
  const { id } = req.params;
  const { busNumber, route } = req.body;
  try {
    const bus = await Bus.findByIdAndUpdate(id, { busNumber, route }, { new: true });
    if (bus) res.json(bus);
    else res.status(404).json({ error: 'Bus not found' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteBus = async (req, res) => {
  const { id } = req.params;
  try {
    const bus = await Bus.findByIdAndDelete(id);
    if (bus) res.json({ success: true });
    else res.status(404).json({ error: 'Bus not found' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const addStudent = async (req, res) => {
  const { studentId, name, password, registeredRoutes } = req.body;
  try {
    const student = new Student({ studentId, name, password, registeredRoutes });
    await student.save();
    res.json(student);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const listStudents = async (req, res) => {
  try {
    const students = await Student.find();
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
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
    );
    if (student) res.json(student);
    else res.status(404).json({ error: 'Student not found' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const viewLocations = async (req, res) => {
  const Location = require('../models/Location');
  try {
    const locs = await Location.find().populate('busId');
    res.json(locs);
  } catch (err) {
    res.status(500).json({ error: err.message });
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
