const mongoose = require('mongoose');

const patientDetailSchema = new mongoose.Schema({
  PatientId: { type: Number, required: true,unique: true,ref: 'Patient' },
  PatientAge: { type: Number, required: true },
  PatientGender: { type: String, required: true },
  PatientBloodGroup: { type: String, required: true },
  PatientEmergencyContact: { type: Array, required: true },
  PatientMedicalRecord: { type: Array, required: true },
  PatientHeight: { type: Number, required: true },
  PatientWeight: { type: Number, required: true },
});

module.exports = mongoose.model('PatientDetail', patientDetailSchema); 