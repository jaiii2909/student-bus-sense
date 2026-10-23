const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  studentId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  password: { type: String, required: true },
  registeredRoutes: [{ type: String }], // optional list of route names
  // logins issued before this time are no longer accepted
  passwordChangedAt: { type: Date, default: null },
});

module.exports = mongoose.model('Student', studentSchema);