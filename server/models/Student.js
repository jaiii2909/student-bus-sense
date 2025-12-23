const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  registeredRoutes: [{ type: String }],
});

module.exports = mongoose.model('Student', studentSchema);