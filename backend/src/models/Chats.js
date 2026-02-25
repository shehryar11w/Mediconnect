const mongoose = require('mongoose');

const chatsSchema = new mongoose.Schema({
  ChatId: { type: Number, required: true, unique: true },
  ChatAppointmentId: { type: Number, required: true, unique: true },
  AppointmentDoctorId: { type: Number, required: true, ref: 'Doctor', index: true },
  AppointmentPatientId: { type: Number, required: true, ref: 'Patient', index: true },
  ChatLastMessage: { type: String, default: '' },
  ChatLastMessageTime: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
});

// Compound indexes for common queries
chatsSchema.index({ ChatAppointmentId: 1 });
chatsSchema.index({ AppointmentDoctorId: 1 });
chatsSchema.index({ AppointmentPatientId: 1 });

module.exports = mongoose.model('Chats', chatsSchema); 