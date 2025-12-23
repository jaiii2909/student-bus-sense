const mongoose = require('mongoose');

const busSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  route: { type: String, required: true },
  number: { type: String, required: true },
  status: { type: String, enum: ['active', 'inactive'], default: 'inactive' },
  sharing: { type: Boolean, default: true } ,
  coordinates: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  heading: { type: Number, default: 0 }
});

module.exports = mongoose.model('Bus', busSchema);