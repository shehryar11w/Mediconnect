const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  AppointmentId: { type: Number, required: true, unique: true },
  AppointmentStartDateTime: { type: Date, required: true, index: true },
  AppointmentEndDateTime: { type: Date, required: true },
  AppointmentReason: { type: String, required: true },
  AppointmentDoctorId: { type: Number, required: true, ref: 'Doctor', index: true },
  AppointmentPatientId: { type: Number, required: true, ref: 'Patient', index: true },
  AppointmentCost: { type: Number, required: true },
  AppointmentStatus: { 
    type: String, 
    required: true,
    enum: ['pending', 'rescheduled', 'completed', 'cancelled'],
    index: true 
  },
  PreviousAppointmentId: { type: Number, ref: 'Appointment' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Compound indexes for common queries
appointmentSchema.index({ AppointmentDoctorId: 1, AppointmentStartDateTime: 1 });
appointmentSchema.index({ AppointmentPatientId: 1, AppointmentStartDateTime: 1 });
appointmentSchema.index({ AppointmentStatus: 1, AppointmentStartDateTime: 1 });

// Pre-save middleware to update the updatedAt field
appointmentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Appointment', appointmentSchema); 