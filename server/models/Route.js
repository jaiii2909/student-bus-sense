const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
  routeName: { type: String, required: true, unique: true }
});

module.exports = mongoose.model('Route', routeSchema);
