const mongoose = require('mongoose');

const messagesSchema = new mongoose.Schema({
  MessageId: { type: Number, required: true, unique: true },
  MessageChatId: { type: Number, required: true },
  MessageDoctorId: { type: Number, required: true, ref: 'Doctor', index: true },
  MessageSenderId: { type: Number, required: true, ref: 'Doctor', index: true },
  MessageSenderType: { type: String, required: true, enum: ['doctor', 'patient'] },
  MessageContent: { type: String, required: true },
  MessageSentAt: { type: Date, default: Date.now },
  MessageRead: { type: Boolean, default: false },
  MessageReadAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

// Compound indexes for common queries
messagesSchema.index({ MessageChatId: 1 });
messagesSchema.index({ MessageDoctorId: 1 });
messagesSchema.index({ MessagePatientId: 1 });

module.exports = mongoose.model('Messages', messagesSchema); 