const mongoose = require('mongoose');

// a stop on the route, kept in travel order
const stopSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  lat: { type: Number, required: true, min: -90, max: 90 },
  lng: { type: Number, required: true, min: -180, max: 180 }
}, { _id: false });

const routeSchema = new mongoose.Schema({
  routeName: { type: String, required: true, unique: true },
  stops: { type: [stopSchema], default: [] }
});

module.exports = mongoose.model('Route', routeSchema);
