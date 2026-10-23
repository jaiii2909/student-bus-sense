const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  message: { type: String, required: true, trim: true, maxlength: 280 },
  // route name, or null for every route
  route: { type: String, default: null },
  // MongoDB deletes the document automatically after this time (TTL index)
  expiresAt: { type: Date, required: true, expires: 0 },
  createdAt: { type: Date, default: Date.now }
});

// shape sent to admins and students
announcementSchema.methods.toPayload = function toPayload() {
  return {
    id: this._id.toString(),
    message: this.message,
    route: this.route,
    expiresAt: this.expiresAt,
    createdAt: this.createdAt
  };
};

module.exports = mongoose.model('Announcement', announcementSchema);
