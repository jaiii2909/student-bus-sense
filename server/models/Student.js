const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  studentId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  password: { type: String, required: true },
  registeredRoutes: [{ type: String }], // optional list of route names
});

module.exports = mongoose.model('Student', studentSchema);