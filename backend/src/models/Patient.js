const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  PatientId: { type: Number, required: true, unique: true },
  PatientName: { type: String, required: true, index: true },
  PatientEmail: { type: String, required: true, unique: true, index: true },
  PatientPhone: { type: String, required: true, unique: true, index: true },
  PatientPassword: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Pre-save middleware to update the updatedAt field
patientSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Patient', patientSchema); 