const Student = require('../models/Student');
const Bus = require('../models/Bus');
const Location = require('../models/Location');

const login = async (req, res) => {
  const { studentId, password } = req.body;
  try {
    const student = await Student.findOne({ studentId, password });
    if (student) {
      // return the student document directly to match frontend expectations
      res.json(student);
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// return all buses with latest location (legacy endpoint)
const viewBuses = async (req, res) => {
  try {
    const locs = await Location.find().populate('busId');
    res.json(locs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// return all buses on student's authorized routes, with latest location if available
const viewAuthorizedBuses = async (req, res) => {
  const { studentId } = req.params;
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

    const mappedBuses = buses.map((bus) => {
      const loc = locationByBusId.get(bus._id.toString());
      return {
        id: bus._id.toString(),
        number: bus.busNumber,
        route: bus.route,
        status: bus.status,
        coordinates: loc
          ? { lat: loc.latitude, lng: loc.longitude }
          : null,
        updatedAt: loc ? loc.updatedAt : null
      };
    });

    res.json({
      studentId: student.studentId,
      registeredRoutes: student.registeredRoutes,
      buses: mappedBuses
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { login, viewBuses, viewAuthorizedBuses };
