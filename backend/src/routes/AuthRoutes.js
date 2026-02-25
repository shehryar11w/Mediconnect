const express = require('express');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const PatientDetail = require('../models/PatientDetail');
const DoctorDetail = require('../models/DoctorDetail');
const router = express.Router();
const bcrypt = require('bcrypt');
const { generateToken } = require('../middleware/auth');
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const validate = require('../middleware/validator');
const ApiResponse = require('../utils/response');
const emailService = require('../services/emailService');

const JWT_SECRET = process.env.JWT_SECRET;

router.post('/doctorLogin', validate([
  body('email').isEmail().withMessage('Invalid email address'),
  body('password').notEmpty().withMessage('Password is required')
]), async (req, res) => {
  const { email, password } = req.body;
  const doctor = await Doctor.findOne({ DoctorEmail: email });
  if (!doctor) {
    return ApiResponse.error(res, 'Invalid email or password', 401);
  }
  const isPasswordValid = await bcrypt.compare(password, doctor.DoctorPassword);
  if (!isPasswordValid) {
    return ApiResponse.error(res, 'Invalid email or password', 401);
  }
  const token = generateToken(doctor);
  res.status(200).json({ 
    message: 'Login successful',
    token,
    user: {
      id: doctor.DoctorId,
      name: doctor.DoctorName,
      email: doctor.DoctorEmail,
      role: 'doctor'
    }
  });
});

router.post('/patientLogin', validate([
  body('email').isEmail().withMessage('Invalid email address'),
  body('password').notEmpty().withMessage('Password is required')
]), async (req, res) => {
  const { email, password } = req.body;
  const patient = await Patient.findOne({ PatientEmail: email });
  if (!patient) {
    return ApiResponse.error(res, 'Invalid email or password', 401);
  }
  const isPasswordValid = await bcrypt.compare(password, patient.PatientPassword);
  if (!isPasswordValid) {
    return ApiResponse.error(res, 'Invalid email or password', 401);
  }
  const token = generateToken(patient);
  res.status(200).json({ 
    message: 'Login successful',
    token,
    user: {
      id: patient.PatientId,
      name: patient.PatientName,
      email: patient.PatientEmail,
      role: 'patient'
    }
  });
});

router.post('/doctorRegister', validate([
  body('email').isEmail().withMessage('Invalid email address'),
  body('password').notEmpty().withMessage('Password is required'),
  body('name').notEmpty().withMessage('Name is required'),
  body('phone').notEmpty().withMessage('Phone is required'),
  body('specialization').notEmpty().withMessage('Specialization is required')
]), async (req, res) => {
  const { email, password, name, phone, specialization } = req.body;

  const existingDoctor = await Doctor.findOne({ DoctorEmail: email });
  if (existingDoctor) {
    return ApiResponse.error(res, 'Doctor already exists', 401);
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const lastDoctor = await Doctor.findOne().sort({ DoctorId: -1 });
  const newDoctorId = lastDoctor ? lastDoctor.DoctorId + 1 : 1;

  const newDoctor = new Doctor({
    DoctorId: newDoctorId,
    DoctorName: name,
    DoctorEmail: email,
    DoctorPhone: phone,
    DoctorSpecialization: specialization,
    DoctorPassword: hashedPassword,
  });

  await newDoctor.save();
  const newDoctorDetail = new DoctorDetail({
    DoctorId: newDoctorId,
    DoctorAddress: "Not Specified",
    DoctorBaseRate: 0,
    DoctorWorkingHours: [{
      "start": "09:00",
      "end": "17:00"
    }],
    DoctorWorkingDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
    DoctorUnavailableDays: [],
    DoctorEducation: [],
  });
  await newDoctorDetail.save();
  res.status(201).json(newDoctor);
});

router.post('/patientRegister', validate([
  body('email').isEmail().withMessage('Invalid email address'),
  body('password').notEmpty().withMessage('Password is required'),
  body('name').notEmpty().withMessage('Name is required'),
  body('phone').notEmpty().withMessage('Phone is required')
]), async (req, res) => {
  const { email, password, name, phone} = req.body;
  const existingPatient = await Patient.findOne({ PatientEmail: email });
  if (existingPatient) {
    return ApiResponse.error(res, 'Patient already exists', 401);
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const lastPatient = await Patient.findOne().sort({ PatientId: -1 });
  const newPatientId = lastPatient ? lastPatient.PatientId + 1 : 1;
  const newPatient = new Patient({
    PatientId: newPatientId,
    PatientName: name,
    PatientEmail: email,
    PatientPhone: phone,
    PatientPassword: hashedPassword,
  });
  const newPatientDetail = new PatientDetail({
    PatientId: newPatientId,
    PatientAge: 0,
    PatientGender: "Not Specified",
    PatientBloodGroup: "Not Specified",
    PatientEmergencyContact: [],
    PatientMedicalRecord: [],
    PatientHeight: 0,
    PatientWeight: 0,
  });
  await newPatient.save();
  await newPatientDetail.save();
  res.status(201).json(newPatient);
});

// Validate token route
router.get('/validate-token', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return ApiResponse.error(res, 'No token provided', 401);
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    let user;

    if (decoded.role === 'doctor') {
      user = await Doctor.findOne({ DoctorId: decoded.id });
    } else {
      user = await Patient.findOne({ PatientId: decoded.id });
    }

    if (!user) {
      return ApiResponse.error(res, 'User not found', 401);
    }

    res.json({
      valid: true,
      user: {
        id: user.DoctorId || user.PatientId,
        name: user.DoctorName || user.PatientName,
        email: user.DoctorEmail || user.PatientEmail,
        role: decoded.role
      }
    });
  } catch (error) {
    console.error('Token validation error:', error);
    return ApiResponse.error(res, 'Invalid token', 401);
  }
});

router.post('/forgotPassword', validate([
  body('email').isEmail().withMessage('Invalid email address'),
]), async (req, res) => {
  const { email } = req.body;
  const patient = await Patient.findOne({ PatientEmail: email });
  if (!patient) {
    return ApiResponse.error(res, 'Patient not found', 401);
  }
  const patientToken = jwt.sign({ id: patient.PatientId, role: 'patient' }, JWT_SECRET, { expiresIn: '1h' });
  await emailService.sendPasswordResetEmail(email, patientToken);
  const doctor = await Doctor.findOne({ DoctorEmail: email });
  let doctorToken = null;

  if (doctor) {
    const doctorToken = jwt.sign({ id: doctor.DoctorId, role: 'doctor' }, JWT_SECRET, { expiresIn: '1h' });
    await emailService.sendPasswordResetEmail(email, doctorToken);
    doctorToken = doctorToken;
    patientToken = null;
  }
  res.status(200).json({
    message: 'Password reset email sent',
    patientToken,
    doctorToken
  });
});

router.post('/verifyToken', validate([
  body('token').notEmpty().withMessage('Token is required'),
]), async (req, res) => {
  try {
    const { token } = req.body;
    const decoded = jwt.verify(token, JWT_SECRET);
    let user;
    
    if (decoded.role === 'patient') {
      user = await Patient.findOne({ PatientId: decoded.id });
    } else {
      user = await Doctor.findOne({ DoctorId: decoded.id });
    }

    if (!user) {
      return ApiResponse.error(res, 'User not found', 401);
    }

    res.status(200).json({
      message: 'Token verified',
      user: {
        id: user.PatientId || user.DoctorId,
        name: user.PatientName || user.DoctorName,
        email: user.PatientEmail || user.DoctorEmail,
        role: decoded.role
      }
    });
  } catch (error) {
    console.error('Token verification error:', error);
    return ApiResponse.error(res, 'Invalid token', 401);
  }
});

router.post('/resetPassword', validate([
  body('password').notEmpty().withMessage('Password is required'),
]), async (req, res) => {
  try {
    const { password, userRole, userId } = req.body;
    if (userRole === 'patient') {
      const patient = await Patient.findOne({ PatientId: userId });
      if (!patient) {
        return ApiResponse.error(res, 'Patient not found', 404);
      }
      patient.PatientPassword = await bcrypt.hash(password, 10);
      await patient.save();
    } else {
      const doctor = await Doctor.findOne({ DoctorId: userId });
      if (!doctor) {
        return ApiResponse.error(res, 'Doctor not found', 404);
      }
      doctor.DoctorPassword = await bcrypt.hash(password, 10);
      await doctor.save();
    }

    res.status(200).json({
      message: 'Password reset successful'
    });
  } catch (error) {
    console.error('Password reset error:', error);
    return ApiResponse.error(res, 'Invalid or expired token', 401);
  }
});

module.exports = router; 