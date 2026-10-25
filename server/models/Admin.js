const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  // logins issued before this time are no longer accepted
  passwordChangedAt: { type: Date, default: null }
});

module.exports = mongoose.model('Admin', adminSchema);
