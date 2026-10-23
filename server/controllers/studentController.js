const Student = require('../models/Student');
const Bus = require('../models/Bus');
const Location = require('../models/Location');
const Route = require('../models/Route');
const { comparePassword } = require('../utils/passwords');
const { signToken } = require('../middleware/auth');
const { sendError } = require('../utils/errors');
const { toBusPayload } = require('../utils/busPayload');

const login = async (req, res) => {
  const { studentId, password } = req.body;
  try {
    const student = await Student.findOne({ studentId });
    const isValid = student && await comparePassword(password, student.password);
    if (!isValid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // return frontend-required fields but never include password hash
    const safeStudent = student.toObject();
    delete safeStudent.password;
    safeStudent.token = signToken({ role: 'student', studentId: student.studentId });
    res.json(safeStudent);
  } catch (err) {
    sendError(res, err);
  }
};

// return all buses with latest location (legacy endpoint)
const viewBuses = async (req, res) => {
  try {
    const locs = await Location.find().populate('busId');
    res.json(locs);
  } catch (err) {
    sendError(res, err);
  }
};

// return all buses on student's authorized routes, with latest location if available
const viewAuthorizedBuses = async (req, res) => {
  const { studentId } = req.params;
  // a student may only read their own buses
  if (req.user.studentId !== studentId) {
    return res.status(403).json({ error: 'Not allowed' });
  }
  try {
    const student = await Student.findOne({ studentId });
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const buses = await Bus.find({ route: { $in: student.registeredRoutes } });
    const busIds = buses.map((b) => b._id);
    const locations = await Location.find({ busId: { $in: busIds } });
    const locationByBusId = new Map(
      locations.map((loc) => [loc.busId.toString(), loc])
    );

    // stops of the student's routes, for "my stop" and ETA
    const routes = await Route.find({ routeName: { $in: student.registeredRoutes } });

    res.json({
      studentId: student.studentId,
      registeredRoutes: student.registeredRoutes,
      routes: routes.map((r) => ({ routeName: r.routeName, stops: r.stops })),
      buses: buses.map((bus) => toBusPayload(bus, locationByBusId.get(bus._id.toString())))
    });
  } catch (err) {
    sendError(res, err);
  }
};

module.exports = { login, viewBuses, viewAuthorizedBuses };
