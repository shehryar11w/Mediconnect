const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  DoctorId: { type: Number, required: true, unique: true },
  DoctorName: { type: String, required: true, index: true },
  DoctorEmail: { type: String, required: true, unique: true, index: true },
  DoctorPhone: { type: String, required: true, unique: true, index: true },
  DoctorSpecialization: { type: String, required: true, index: true },
  DoctorPassword: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Compound index for specialization and name search
doctorSchema.index({ DoctorSpecialization: 1, DoctorName: 1 });

// Pre-save middleware to update the updatedAt field
doctorSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Doctor', doctorSchema); 