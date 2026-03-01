const mongoose = require('mongoose');

const busSchema = new mongoose.Schema({
  busNumber: { type: String, required: true, unique: true },
  route: { type: String, required: true }, // name or code referring to a route
  status: { type: String, enum: ['active', 'inactive'], default: 'inactive' }
});

module.exports = mongoose.model('Bus', busSchema);