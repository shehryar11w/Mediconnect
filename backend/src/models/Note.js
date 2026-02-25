const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  NoteId: { type: Number, required: true, unique: true },
  NotePatientId: { type: Number, required: true, ref: 'Patient', index: true },
  NoteContent: { type: String, required: true },
  NoteStatus: { 
    type: String, 
    required: true,
    enum: ['general', 'symptoms', 'treatment', 'follow-up'],
    index: true 
  },
  NoteDateTime: { type: Date, required: true, default: Date.now, index: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Compound indexes for common queries
noteSchema.index({ NotePatientId: 1, NoteDateTime: -1 });
noteSchema.index({ NoteStatus: 1, NoteDateTime: -1 });

// Pre-save middleware to update the updatedAt field
noteSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Note', noteSchema); 