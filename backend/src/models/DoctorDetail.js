const mongoose = require('mongoose');

const doctorDetailSchema = new mongoose.Schema({
  DoctorId: { type: Number, required: true,unique: true,ref: 'Doctor' },
  DoctorAddress: { type: String, required: true },
  DoctorBaseRate: { type: Number, required: true },
  DoctorWorkingHours: { type: Array, required: true },
  DoctorWorkingDays: { type: Array, required: true },
  DoctorUnavailableDays: { type: Array, required: true },
  DoctorEducation: { type: Array, required: true },
});

module.exports = mongoose.model('DoctorDetail', doctorDetailSchema); 