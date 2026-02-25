const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  ReportId: { type: Number, required: true, unique: true },
  ReportPatientId: { type: Number, required: true, ref: 'Patient', index: true },
  ReportFile: { type: String, required: true },
  ReportTitle: { type: String, required: true },
  ReportDescription: { type: String, required: true },
  ReportType: { 
    type: String, 
    required: true,
    enum: ['lab', 'imaging', 'consultation', 'forms'],
    index: true 
  },
  ReportDate: { type: Date, required: true, default: Date.now, index: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Compound indexes for common queries
reportSchema.index({ ReportPatientId: 1, ReportDate: -1 });
reportSchema.index({ ReportType: 1, ReportDate: -1 });

// Pre-save middleware to update the updatedAt field
reportSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Report', reportSchema); 