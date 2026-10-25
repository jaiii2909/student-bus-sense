const Student = require('../models/Student');
const Bus = require('../models/Bus');
const Location = require('../models/Location');
const Route = require('../models/Route');
const Announcement = require('../models/Announcement');
const { comparePassword, hashPassword, newPasswordError } = require('../utils/passwords');
const { signToken, isTokenOutdated } = require('../middleware/auth');
const { sendError } = require('../utils/errors');
const { asText } = require('../utils/input');
const { toBusPayload } = require('../utils/busPayload');

const login = async (req, res) => {
  const studentId = asText(req.body.studentId);
  const { password } = req.body;
  if (!studentId) return res.status(401).json({ error: 'Invalid credentials' });
  try {
    const student = await Student.findOne({ studentId });
    const isValid = student && await comparePassword(password, student.password);
    if (!isValid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    if (student.isPassExpired()) {
      const date = student.accessValidUntil.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      return res.status(403).json({ error: `Your bus pass expired on ${date}. Contact the transport office.` });
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
      // deleted by the admin: end this session
      return res.status(401).json({ error: 'Please log in again' });
    }
    // password was reset or changed since this login
    if (isTokenOutdated(req.user, student.passwordChangedAt)) {
      return res.status(401).json({ error: 'Please log in again' });
    }
    if (student.isPassExpired()) {
      return res.status(401).json({ error: 'Your bus pass has expired' });
    }

    const buses = await Bus.find({ route: { $in: student.registeredRoutes } });
    const busIds = buses.map((b) => b._id);
    const locations = await Location.find({ busId: { $in: busIds } });
    const locationByBusId = new Map(
      locations.map((loc) => [loc.busId.toString(), loc])
    );

    // stops of the student's routes, for "my stop" and ETA
    const routes = await Route.find({ routeName: { $in: student.registeredRoutes } });

    // active announcements for the student's routes and for everyone
    const announcements = await Announcement.find({
      expiresAt: { $gt: new Date() },
      $or: [{ route: null }, { route: { $in: student.registeredRoutes } }]
    }).sort({ createdAt: -1 }).limit(10);

    res.json({
      studentId: student.studentId,
      registeredRoutes: student.registeredRoutes,
      routes: routes.map((r) => ({ routeName: r.routeName, stops: r.stops })),
      announcements: announcements.map((a) => a.toPayload()),
      buses: buses.map((bus) => toBusPayload(bus, locationByBusId.get(bus._id.toString())))
    });
  } catch (err) {
    sendError(res, err);
  }
};

// student changes their own password; returns a fresh token for this device
const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const ruleError = newPasswordError(newPassword, 6);
  if (ruleError) return res.status(400).json({ error: ruleError });

  try {
    const student = await Student.findOne({ studentId: req.user.studentId });
    if (!student || !(await comparePassword(currentPassword, student.password))) {
      return res.status(401).json({ error: 'Current password is wrong' });
    }
    student.password = await hashPassword(newPassword);
    student.passwordChangedAt = new Date();
    await student.save();
    res.json({ success: true, token: signToken({ role: 'student', studentId: student.studentId }) });
  } catch (err) {
    sendError(res, err);
  }
};

module.exports = { login, viewBuses, viewAuthorizedBuses, changePassword };
