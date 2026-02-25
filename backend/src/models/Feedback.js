const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  FeedbackId: { type: Number, required: true, unique: true },
  FeedbackAppointmentId: { type: Number, required: true, ref: 'Appointment', index: true },
  FeedbackRating: { type: Number, required: true, index: true },
  FeedbackComment: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Compound indexes for common queries
feedbackSchema.index({ FeedbackAppointmentId: 1, FeedbackRating: 1 });

// Pre-save middleware to update the updatedAt field
feedbackSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Feedback', feedbackSchema); 