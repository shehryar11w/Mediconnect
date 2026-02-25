const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  NotificationId: { type: Number, required: true, unique: true },
  NotificationAppointmentId: { type: Number, required: true, ref: 'Appointment', index: true },
  NotificationContent: { type: String, required: true },
  NotificationHeading: { type: String, required: true },
  NotificationDateTime: { type: Date, required: true, default: Date.now, index: true },
  isRead: { type: Boolean, default: false, index: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Compound indexes for common queries
notificationSchema.index({ NotificationAppointmentId: 1, NotificationDateTime: -1 });
notificationSchema.index({ isRead: 1, NotificationDateTime: -1 });

// Pre-save middleware to update the updatedAt field
notificationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Notification', notificationSchema); 