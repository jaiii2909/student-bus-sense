const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  username: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true },
  // disabled drivers can't log in or share location; their trips stay in the log
  active: { type: Boolean, default: true },
  // logins issued before this time are no longer accepted
  passwordChangedAt: { type: Date, default: null }
});

module.exports = mongoose.model('Driver', driverSchema);
