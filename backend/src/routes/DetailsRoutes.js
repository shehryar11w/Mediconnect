const express = require('express');
const router = express.Router();
const PatientDetail = require('../models/PatientDetail');
const DoctorDetail = require('../models/DoctorDetail');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const { auth } = require('../middleware/auth');
const { param, body } = require('express-validator');
const validate = require('../middleware/validator');
const ApiResponse = require('../utils/response');

// Patient Details Routes

// Add patient details
router.post('/patient/:patientId', auth , validate([
  param('patientId').isInt().withMessage('Patient ID must be an integer'),
  body('age').isInt().withMessage('Age must be an integer'),
  body('gender').notEmpty().withMessage('Gender is required'),
  body('bloodGroup').notEmpty().withMessage('Blood group is required'),
  body('emergencyContact').notEmpty().withMessage('Emergency contact is required'),
  body('medicalRecord').notEmpty().withMessage('Medical record is required'),
  body('height').isInt().withMessage('Height must be an integer'),
]), async (req, res) => {

    const { patientId } = req.params;
    const {
      age,
      gender,
      bloodGroup,
      emergencyContact,
      medicalRecord,
      height,
      weight
    } = req.body;

    if (req.user.role !== 'patient') {
      return ApiResponse.error(res, 'Only patients can add their details', 403);
    }
    // Check if patient exists
    const patient = await Patient.findOne({ PatientId: parseInt(patientId) });
    if (!patient) {
      return ApiResponse.error(res, 'Patient not found', 404);
    }
    // Check if details already exist
    const existingDetails = await PatientDetail.findOne({ PatientId: parseInt(patientId) });
    if (existingDetails) {
      return ApiResponse.error(res, 'Patient details already exist. Use PUT to update.', 400);
    }

    const patientDetail = new PatientDetail({
      PatientId: parseInt(patientId),
      PatientAge: age,
      PatientGender: gender,
      PatientBloodGroup: bloodGroup,
      PatientEmergencyContact: emergencyContact,
      PatientMedicalRecord: medicalRecord,
      PatientHeight: height,
      PatientWeight: weight
    });

    await patientDetail.save();
    return ApiResponse.success(res, patientDetail, 'Patient details added successfully');
});

// Update patient details
router.put('/patient/:patientId', auth , validate([
  param('patientId').isInt().withMessage('Patient ID must be an integer'),
]), async (req, res) => {
  
    const { patientId } = req.params;
    const updateData = req.body;

    if (req.user.role !== 'patient') {
      return ApiResponse.error(res, 'Only patients can update their details', 403);
    }

    // Remove any undefined fields
    Object.keys(updateData).forEach(key => 
      updateData[key] === undefined && delete updateData[key]
    );

    const PatientFields = {};
    const DetailFields = {};

    Object.entries(updateData).forEach(([key, value]) => {
      if (['PatientAge', 'PatientGender', 'PatientBloodGroup', 'PatientEmergencyContact', 'PatientMedicalRecord', 'PatientHeight', 'PatientWeight'].includes(key)) {
        DetailFields[key] = value;
      } else {
        PatientFields[key] = value;
      }
    });

    if (Object.keys(PatientFields).length > 0) {
      const patient = await Patient.findOneAndUpdate(
        { PatientId: parseInt(patientId) },
        { $set: PatientFields },
        { new: true }
      );

      if (!patient) {
        return ApiResponse.error(res, 'Patient not found', 404);
      }
    }

    if (Object.keys(DetailFields).length > 0) {

    const patientDetail = await PatientDetail.findOneAndUpdate(
      { PatientId: parseInt(patientId) },
        { $set: DetailFields },
        { new: true }
      );

      if (!patientDetail) {
        return ApiResponse.error(res, 'Patient details not found', 404);
      }
    }

    const patient = await Patient.findOne({ PatientId: parseInt(patientId) });
    const patientDetail = await PatientDetail.findOne({ PatientId: parseInt(patientId) });

    return ApiResponse.success(res, {
      basicInfo: {
        name: patient.PatientName,
        email: patient.PatientEmail,
        phone: patient.PatientPhone,
      },
      details: patientDetail
    }, 'Patient details updated successfully');
});

// Get patient details
router.get('/patient/:patientId', auth , validate([
  param('patientId').isInt().withMessage('Patient ID must be an integer')
]), async (req, res) => {
  
    
    const { patientId } = req.params;

    const patientDetail = await PatientDetail.findOne({ PatientId: parseInt(patientId) });
    if (!patientDetail) {
      return ApiResponse.error(res, 'Patient details not found', 404);
    }

    // Get basic patient info
    const patient = await Patient.findOne({ PatientId: parseInt(patientId) });
    
    return ApiResponse.success(res, {
      basicInfo: {
        name: patient.PatientName,
        email: patient.PatientEmail,
        phone: patient.PatientPhone
      },
      details: patientDetail
    });
});

// Doctor Details Routes

// Add doctor details
router.post('/doctor/:doctorId', auth , validate([
  param('doctorId').isInt().withMessage('Doctor ID must be an integer'),
  body('address').notEmpty().withMessage('Address is required'),
  body('baseRate').notEmpty().withMessage('Base rate is required'),
  body('workingHours').notEmpty().withMessage('Working hours are required'),
  body('workingDays').notEmpty().withMessage('Working days are required'),
  body('unavailableDays').notEmpty().withMessage('Unavailable days are required'),
  body('education').notEmpty().withMessage('Education is required')
]), async (req, res) => {
  
    const { doctorId } = req.params;
    const {
      address,
      baseRate,
      workingHours,
      workingDays,
      unavailableDays,
      education
    } = req.body;

    // Check if doctor exists
    const doctor = await Doctor.findOne({ DoctorId: parseInt(doctorId) });
    if (!doctor) {
      return ApiResponse.error(res, 'Doctor not found', 404);
    }

    // Check if details already exist
    const existingDetails = await DoctorDetail.findOne({ DoctorId: parseInt(doctorId) });
    if (existingDetails) {
      return ApiResponse.error(res, 'Doctor details already exist. Use PUT to update.', 400);
    }

    const doctorDetail = new DoctorDetail({
      DoctorId: parseInt(doctorId),
      DoctorAddress: address,
      DoctorBaseRate: baseRate,
      DoctorWorkingHours: workingHours,
      DoctorWorkingDays: workingDays,
      DoctorUnavailableDays: unavailableDays,
      DoctorEducation: education
    });

    await doctorDetail.save();
    return ApiResponse.success(res, doctorDetail, 'Doctor details added successfully');
});

// Update doctor details
router.put('/doctor/:doctorId', auth , validate([
  param('doctorId').isInt().withMessage('Doctor ID must be an integer')
]), async (req, res) => {
  
    const { doctorId } = req.params;
    const updateData = req.body;

    if (req.user.role !== 'doctor') {
      return ApiResponse.error(res, 'Only doctors can update their details', 403);
    }

    // Remove any undefined fields
    Object.keys(updateData).forEach(key => 
      updateData[key] === undefined && delete updateData[key]
    );

    // Separate doctor and doctor detail fields
    const doctorFields = {};
    const detailFields = {};

    Object.entries(updateData).forEach(([key, value]) => {
      if (['DoctorName', 'DoctorEmail', 'DoctorPhone', 'DoctorSpecialization'].includes(key)) {
        doctorFields[key] = value;
      } else {
        detailFields[key] = value;
      }
    });
    // Update doctor if there are doctor fields
    if (Object.keys(doctorFields).length > 0) {
      const doctor = await Doctor.findOneAndUpdate(
        { DoctorId: parseInt(doctorId) },
        { $set: doctorFields },
        { new: true }
      );
      
      if (!doctor) {
        return ApiResponse.error(res, 'Doctor not found', 404);
      }
    }

    // Update doctor details if there are detail fields
    if (Object.keys(detailFields).length > 0) {
      const doctorDetail = await DoctorDetail.findOneAndUpdate(
        { DoctorId: parseInt(doctorId) },
        { $set: detailFields },
        { new: true }
      );

      if (!doctorDetail) {
        return ApiResponse.error(res, 'Doctor details not found', 404);
      }
    }

    // Get updated records
    const doctor = await Doctor.findOne({ DoctorId: parseInt(doctorId) });
    const doctorDetail = await DoctorDetail.findOne({ DoctorId: parseInt(doctorId) });

    return ApiResponse.success(res, {
      basicInfo: {
        name: doctor.DoctorName,
        email: doctor.DoctorEmail, 
        phone: doctor.DoctorPhone,
        specialization: doctor.DoctorSpecialization
      },
      details: doctorDetail
    }, 'Doctor information updated successfully');
});

// Get doctor details
router.get('/doctor/:doctorId', auth , validate([
  param('doctorId').isInt().withMessage('Doctor ID must be an integer')
]), async (req, res) => {
  
    const { doctorId } = req.params;

    if (req.user.role !== 'doctor') {
      return ApiResponse.error(res, 'Only doctors can view their details', 403);
    }

    const doctorDetail = await DoctorDetail.findOne({ DoctorId: parseInt(doctorId) });
    if (!doctorDetail) {
      return ApiResponse.error(res, 'Doctor details not found', 404);
    }

    // Get basic doctor info
    const doctor = await Doctor.findOne({ DoctorId: parseInt(doctorId) });
    
    return ApiResponse.success(res, {
      basicInfo: {
        name: doctor.DoctorName,
        email: doctor.DoctorEmail,
        phone: doctor.DoctorPhone,
        specialization: doctor.DoctorSpecialization
      },
      details: doctorDetail
    });
});

module.exports = router;
