const express = require('express');
const router = express.Router();
const Prescription = require('../models/Prescription');
const { auth } = require('../middleware/auth');
const { param, body } = require('express-validator');
const validate = require('../middleware/validator');
const ApiResponse = require('../utils/response');

// Doctor Routes

// Add new prescription
router.post('/doctor/add', auth , validate([
  body('patientId').isInt().withMessage('Patient ID must be an integer'),
  body('medicine').notEmpty().withMessage('Medicine is required'),
  body('dosage').notEmpty().withMessage('Dosage is required'),
  body('frequency').notEmpty().withMessage('Frequency is required'),
  body('duration').isInt().withMessage('Duration is required'),
  body('notes').optional().isString().withMessage('Notes must be a string')
]), async (req, res) => {
  
    const { 
      patientId, 
      medicine, 
      dosage, 
      frequency, 
      duration,
      notes 
    } = req.body;
    console.log(req.body);
    if (req.user.role !== 'doctor') {
      return ApiResponse.error(res, 'Only doctors can add prescriptions', 403);
    }

    // Validate required fields
    if (!patientId || !medicine || !dosage || !frequency || !duration) {
      return ApiResponse.error(res, 'All fields (patientId, medicine, dosage, frequency, duration) are required', 400);
    }

    // Get the last prescription ID
    const lastPrescription = await Prescription.findOne().sort({ PrescriptionId: -1 });
    const newPrescriptionId = lastPrescription ? lastPrescription.PrescriptionId + 1 : 1;

    const prescription = new Prescription({
      PrescriptionId: newPrescriptionId,
      PrescriptionPatientId: patientId,
      PrescriptionMedicine: medicine,
      PrescriptionDosage: dosage,
      PrescriptionFrequency: frequency,
      PrescriptionDuration: duration,
      PrescriptionDate: new Date(),
      PrescriptionNotes: notes
    });

    await prescription.save();
    return ApiResponse.success(res, prescription, 'Prescription added successfully');
  
});

// Get all prescriptions for a patient (Doctor's view)
router.get('/doctor/patient/:patientId', auth , validate([
  param('patientId').isInt().withMessage('Patient ID must be an integer')
]), async (req, res) => {
  
    const { patientId } = req.params;
    const { startDate, endDate } = req.query;

    if (req.user.role !== 'doctor') {
      return ApiResponse.error(res, 'Only doctors can view patient prescriptions', 403);
    }

    let query = { PrescriptionPatientId: parseInt(patientId) };

    // Filter by date range if provided
    if (startDate && endDate) {
      query.PrescriptionDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const prescriptions = await Prescription.find(query)
      .sort({ PrescriptionDate: -1 }); // Sort by date, newest first

    return ApiResponse.success(res, prescriptions);
});

// Patient Routes

// Get all prescriptions for a patient (Patient's view)
router.get('/patient/:patientId', auth , validate([
  param('patientId').isInt().withMessage('Patient ID must be an integer')
]), async (req, res) => {
  
    const { patientId } = req.params;
    const { active } = req.query;

    if (req.user.role !== 'patient') {
      return ApiResponse.error(res, 'Only patients can view their prescriptions', 403);
    }

    let query = { PrescriptionPatientId: parseInt(patientId) };

    // If active=true, only return prescriptions that haven't expired
    if (active === 'true') {
      const now = new Date();
      const prescriptions = await Prescription.find(query);
      
      const activePrescriptions = prescriptions.filter(prescription => {
        const startDate = new Date(prescription.PrescriptionDate);
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + parseInt(prescription.PrescriptionDuration));
        return now <= endDate;
      });

      return ApiResponse.success(res, activePrescriptions);
    }

    // Return all prescriptions if active filter is not specified
    const prescriptions = await Prescription.find(query)
      .sort({ PrescriptionDate: -1 });

    return ApiResponse.success(res, prescriptions);
});

// Get prescription details with expiry information
router.get('/patient/prescription/:prescriptionId', auth , validate([
  param('prescriptionId').isInt().withMessage('Prescription ID must be an integer')
]), async (req, res) => {
  
    const { prescriptionId } = req.params;

    if (req.user.role !== 'patient') {
      return ApiResponse.error(res, 'Only patients can view their prescriptions', 403);
    }

    const prescription = await Prescription.findOne({
      PrescriptionId: parseInt(prescriptionId)
    });

    if (!prescription) {
      return ApiResponse.error(res, 'Prescription not found', 404);
    }

    // Calculate expiry date
    const startDate = new Date(prescription.PrescriptionDate);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + parseInt(prescription.PrescriptionDuration));
    
    const isActive = new Date() <= endDate;

    return ApiResponse.success(res, {
      ...prescription.toObject(),
      expiryDate: endDate,
      isActive,
      daysRemaining: isActive ? Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24)) : 0
    });
  
});

module.exports = router;
