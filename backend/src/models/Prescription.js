const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
  PrescriptionId: { type: Number, required: true, unique: true },
  PrescriptionPatientId: { type: Number, required: true, ref: 'Patient', index: true },
  PrescriptionMedicine: { type: String, required: true, index: true },
  PrescriptionDosage: { type: String, required: true },
  PrescriptionFrequency: { type: String, required: true },
  PrescriptionDuration: { type: Number, required: true }, // in days
  PrescriptionDate: { type: Date, required: true, default: Date.now, index: true },
  PrescriptionNotes: { type: String, required: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Compound indexes for common queries
prescriptionSchema.index({ PrescriptionPatientId: 1, PrescriptionDate: -1 });
prescriptionSchema.index({ PrescriptionMedicine: 1, PrescriptionDate: -1 });

// Pre-save middleware to update the updatedAt field
prescriptionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Prescription', prescriptionSchema); 