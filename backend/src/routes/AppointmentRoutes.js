const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const { auth } = require('../middleware/auth');
const { param, body } = require('express-validator');
const validate = require('../middleware/validator');
const ApiResponse = require('../utils/response');
const { APPOINTMENT_STATUS } = require('../utils/constants');
const Doctor = require('../models/Doctor');
const DoctorDetail = require('../models/DoctorDetail');
const Patient = require('../models/Patient');
const EmailService = require('../services/emailService');
const Chats = require('../models/Chats');

// Helper function to check for appointment overlaps
const checkAppointmentOverlap = async (doctorId, startDateTime, endDateTime, excludeAppointmentId = null) => {
  const query = {
    AppointmentDoctorId: doctorId,
    AppointmentStatus: 'active', // Only check overlaps with active appointments
    $or: [
      {
        AppointmentStartDateTime: { $lt: endDateTime },
        AppointmentEndDateTime: { $gt: startDateTime }
      }
    ]
  };

  if (excludeAppointmentId) {
    query.AppointmentId = { $ne: excludeAppointmentId };
  }

  const overlappingAppointment = await Appointment.findOne(query);
  return overlappingAppointment;
};

// Helper function to validate status transition
const isValidStatusTransition = (currentStatus, newStatus) => {
  const validTransitions = {
    [APPOINTMENT_STATUS.PENDING]: [APPOINTMENT_STATUS.COMPLETED, APPOINTMENT_STATUS.RESCHEDULED, APPOINTMENT_STATUS.CANCELLED],
    [APPOINTMENT_STATUS.COMPLETED]: [], // No transitions from completed
    [APPOINTMENT_STATUS.RESCHEDULED]: [APPOINTMENT_STATUS.COMPLETED, APPOINTMENT_STATUS.RESCHEDULED, APPOINTMENT_STATUS.CANCELLED],
    [APPOINTMENT_STATUS.CANCELLED]: [] // No transitions from cancelled
  };

  return validTransitions[currentStatus]?.includes(newStatus) || false;
};

// ------------------------------------------------------------------------------------------------ Patient Routes

// Cancel appointment
router.post('/patient/cancel/:appointmentId', auth,validate([
  param('appointmentId').isInt().withMessage('Appointment ID must be an integer')
]), async (req, res) => {
  
    const { appointmentId } = req.params;
    const patientId = req.user.id;

    if (req.user.role !== 'patient') {
      return ApiResponse.error(res, 'Only patients can cancel their appointments', 403);
    }

    const appointment = await Appointment.findOne({
      AppointmentId: appointmentId,
      AppointmentPatientId: patientId
    });

    if (!appointment) {
      return ApiResponse.error(res, 'Appointment not found or unauthorized', 404);
    }

    if (!isValidStatusTransition(appointment.AppointmentStatus, 'cancelled')) {
      return ApiResponse.error(res, `Cannot cancel appointment with status: ${appointment.AppointmentStatus}`, 400);
    }

    // Check if appointment is in the future
    if (new Date(appointment.AppointmentStartDateTime) <= new Date()) {
      return ApiResponse.error(res, 'Cannot cancel past appointments', 400);
    }

    appointment.AppointmentStatus = APPOINTMENT_STATUS.CANCELLED;
    await appointment.save();
    
    // Get patient and doctor details for email
    const patient = await Patient.findOne({ PatientId: patientId }).lean();
    const doctor = await Doctor.findOne({ DoctorId: appointment.AppointmentDoctorId }).lean();

    // Send emails
    await EmailService.sendCancelledAppointmentEmail(appointment, patient, doctor);

    return ApiResponse.success(res, appointment, 'Appointment cancelled successfully');

});

// Reschedule appointment
router.put('/patient/reschedule/:appointmentId', auth,validate([
  param('appointmentId').isInt().withMessage('Appointment ID must be an integer')
]), async (req, res) => {
  
    const { appointmentId } = req.params;
    const patientId = req.user.id;
    const { newStartDateTime, newEndDateTime, newCost } = req.body;

    console.log(newStartDateTime, newEndDateTime, newCost);
    if (req.user.role !== 'patient') {
      console.log(req.user.role);
      return ApiResponse.error(res, 'Only patients can reschedule their appointments', 403);
    }

    const appointment = await Appointment.findOne({
      AppointmentId: appointmentId,
      AppointmentPatientId: patientId
    });

    if (!appointment) {
      console.log(appointment);
      return ApiResponse.error(res, 'Appointment not found or unauthorized', 404);
    }

    if (!isValidStatusTransition(appointment.AppointmentStatus, 'rescheduled')) {
      console.log(appointment.AppointmentStatus);
      return ApiResponse.error(res, `Cannot reschedule appointment with status: ${appointment.AppointmentStatus}`, 400);
    }

    const startDateTime = new Date(newStartDateTime);
    const endDateTime = new Date(newEndDateTime);

    // Validate dates
    if (startDateTime <= new Date()) {
      console.log(startDateTime);
      return ApiResponse.error(res, 'New appointment must be in the future', 400);
    }

    if (endDateTime <= startDateTime) {
      console.log(endDateTime, startDateTime);
      return ApiResponse.error(res, 'End time must be after start time', 400);
    }

    // Check for overlaps
    const hasOverlap = await checkAppointmentOverlap(
      appointment.AppointmentDoctorId,
      startDateTime,
      endDateTime,
      appointmentId
    );

    if (hasOverlap) {
      console.log(hasOverlap);
      return ApiResponse.error(res, 'This time slot overlaps with another appointment', 400);
    }

    const lastAppointment = await Appointment.findOne().sort({ AppointmentId: -1 });
    const newAppointmentId = lastAppointment ? lastAppointment.AppointmentId + 1 : 1;
    // Create a new appointment with rescheduled status
    const rescheduledAppointment = new Appointment({
      AppointmentId: newAppointmentId,
      AppointmentStartDateTime: startDateTime,
      AppointmentEndDateTime: endDateTime,
      AppointmentReason: appointment.AppointmentReason,
      AppointmentDoctorId: appointment.AppointmentDoctorId,
      AppointmentPatientId: appointment.AppointmentPatientId,
      AppointmentStatus: APPOINTMENT_STATUS.RESCHEDULED,
      AppointmentCost: newCost,
      PreviousAppointmentId: appointment.AppointmentId // Track the original appointment
    });

    // Update original appointment status
    appointment.AppointmentStatus = APPOINTMENT_STATUS.CANCELLED; 
    await appointment.save();
    await rescheduledAppointment.save();
    console.log(rescheduledAppointment);

    // Get patient and doctor details for email
    const patient = await Patient.findOne({ PatientId: patientId }).lean();
    const doctor = await Doctor.findOne({ DoctorId: appointment.AppointmentDoctorId }).lean();

    // Send emails
    await EmailService.sendRescheduledAppointmentEmail(rescheduledAppointment, patient, doctor);

    return ApiResponse.success(res, rescheduledAppointment, 'Appointment rescheduled successfully');

  
});

// Get all doctors and their details (name, specialization, appointments, availability,working hours,working days,unavailable days,avg rating)
router.get('/doctors', auth, async (req, res) => {
  const doctors = await Doctor.find();
  const doctorsWithDetails = await Promise.all(doctors.map(async (doctor) => {
    const appointments = await Appointment.find({ AppointmentDoctorId: doctor.DoctorId });
    const doctorDetails = await DoctorDetail.findOne({ DoctorId: doctor.DoctorId });


    // Get active appointments to determine availability
    const activeAppointments = appointments
      .filter(apt => apt.AppointmentStatus === APPOINTMENT_STATUS.PENDING && apt.AppointmentStartDateTime > new Date())
      .reduce((acc, apt) => {
        const date = apt.AppointmentStartDateTime.toISOString().split('T')[0];
        const timeSlot = `${apt.AppointmentStartDateTime.toISOString().split('T')[1].substring(0,5)}-${apt.AppointmentEndDateTime.toISOString().split('T')[1].substring(0,5)}`;
        
        if (!acc[date]) {
          acc[date] = { slots: [] };
        }
        acc[date].slots.push(timeSlot);
        return acc;
      }, {});

    return {
      DoctorId: doctor.DoctorId,
      DoctorName: doctor.DoctorName,
      DoctorSpecialization: doctor.DoctorSpecialization,
      DoctorBaseRate: doctorDetails?.DoctorBaseRate,
      DoctorAppointments: activeAppointments,
      DoctorWorkingHours: doctorDetails?.DoctorWorkingHours || [],
      DoctorWorkingDays: doctorDetails?.DoctorWorkingDays || [], 
      DoctorUnavailableDays: doctorDetails?.DoctorUnavailableDays || [],
    };
  }));
  return ApiResponse.success(res, doctorsWithDetails);
});

// Create appointment
router.post('/patient/createAppointment', auth , validate([
  body('doctorId').notEmpty().withMessage('Doctor ID is required'),
  body('startDateTime').isISO8601().withMessage('Start date must be in ISO 8601 format'),
  body('endDateTime').isISO8601().withMessage('End date must be in ISO 8601 format'),
  body('reason').notEmpty().withMessage('Reason is required'),
  body('cost').isNumeric().withMessage('Cost must be a number')
]), async (req, res) => {
  
    const patientId = req.user.id;
    const { doctorId, startDateTime, endDateTime, reason, cost } = req.body;

    if (req.user.role !== 'patient') {
      return ApiResponse.error(res, 'Only patients can create appointments', 403);
    }
    // Check if the time slot is available
    const existingAppointment = await Appointment.findOne({
      AppointmentDoctorId: doctorId,
      AppointmentStartDateTime: { $lt: endDateTime },
      AppointmentEndDateTime: { $gt: startDateTime },
      AppointmentStatus: { $nin: ['cancelled', 'completed'] }
    });
    if (!patientId || !doctorId || !startDateTime || !endDateTime || !reason) {
      return ApiResponse.error(res, 'Missing required fields', 400);
    }
    const overlap = await checkAppointmentOverlap(doctorId, startDateTime, endDateTime);
    if (overlap) {
      return ApiResponse.error(res, 'This time slot overlaps with another appointment', 400);
    }
    if (existingAppointment) {
      return ApiResponse.error(res, 'Time slot is not available');
    }

    // Get the next AppointmentId
    const lastAppointment = await Appointment.findOne().sort({ AppointmentId: -1 });
    const newAppointmentId = lastAppointment ? lastAppointment.AppointmentId + 1 : 1;

    const newAppointment = new Appointment({
      AppointmentId: newAppointmentId,
      AppointmentStartDateTime: startDateTime,
      AppointmentEndDateTime: endDateTime,
      AppointmentReason: reason,
      AppointmentDoctorId: doctorId,
      AppointmentPatientId: patientId,
      AppointmentCost: cost,
      AppointmentStatus: APPOINTMENT_STATUS.PENDING
    });

    await newAppointment.save();
    
    // Check if chat already exists with this ID
    const existingChat = await Chats.findOne({ ChatId: newAppointmentId });
    if (!existingChat) {
      const chat = new Chats({
      ChatId: newAppointmentId,
      ChatAppointmentId: newAppointmentId, 
      AppointmentDoctorId: doctorId,
      AppointmentPatientId: patientId,
      ChatLastMessage: '',
      ChatLastMessageTime: new Date()
    });
    console.log(chat);
    await chat.save();
    }

    
    // Get patient and doctor details for email
    const patient = await Patient.findOne({ PatientId: patientId }).lean();
    const doctor = await Doctor.findOne({ DoctorId: doctorId }).lean();

    // Send emails
    await EmailService.sendNewAppointmentEmail(newAppointment, patient, doctor);

    return ApiResponse.success(res, newAppointment, 'Appointment created successfully');
});

// Get all appointments for a specific patient
router.get('/patient/:patientId', auth , validate([
  param('patientId').isInt().withMessage('Patient ID must be an integer')
]), async (req, res) => {
  
    const { patientId } = req.params;

    if (req.user.role !== 'patient' || req.user.id !== parseInt(patientId)) {
      return ApiResponse.error(res, 'Unauthorized access', 403);
    }

    let query = { AppointmentPatientId: patientId };

    const appointments = await Appointment.find(query)
      .sort({ AppointmentStartDateTime: 1 });

    // Get doctor details for each appointment
    const appointmentsWithDoctorDetails = await Promise.all(appointments.map(async (appointment) => {
      const doctor = await Doctor.findOne({ DoctorId: appointment.AppointmentDoctorId });
      
      return {
        ...appointment.toObject(),
        doctorName: doctor?.DoctorName,
        doctorSpecialization: doctor?.DoctorSpecialization
      };
    }));

    return ApiResponse.success(res, appointmentsWithDoctorDetails);
});

// Get Specific Appointment Details for Reschdule
router.get('/:appointmentId', auth , validate([
  param('appointmentId').isInt().withMessage('Appointment ID must be an integer')
]), async (req, res) => {
  
    const { appointmentId } = req.params;
    const appointment = await Appointment.findOne({ AppointmentId: appointmentId });
    if (!appointment) {
      return ApiResponse.error(res, 'Appointment not found', 404);
    }

    const doctorDetails = await DoctorDetail.findOne({ DoctorId: appointment.AppointmentDoctorId });
    const doctorAppointments = await Appointment.find({ AppointmentDoctorId: appointment.AppointmentDoctorId });
    const doctorBookedSlots = doctorAppointments
    .filter(apt => apt.AppointmentStatus === APPOINTMENT_STATUS.PENDING && apt.AppointmentStartDateTime > new Date())
    .reduce((acc, apt) => {
      const date = apt.AppointmentStartDateTime.toISOString().split('T')[0];
      const timeSlot = `${apt.AppointmentStartDateTime.toISOString().split('T')[1].substring(0,5)}-${apt.AppointmentEndDateTime.toISOString().split('T')[1].substring(0,5)}`;
      
      if (!acc[date]) {
        acc[date] = { slots: [] };
      }
      acc[date].slots.push(timeSlot);
      return acc;
    }, {});

    return ApiResponse.success(res, {
      DoctorBaseRate: doctorDetails.DoctorBaseRate,
      DoctorAppointments: doctorDetails.DoctorAppointments,
      DoctorWorkingHours: doctorDetails.DoctorWorkingHours,
      DoctorWorkingDays: doctorDetails.DoctorWorkingDays,
      DoctorUnavailableDays: doctorDetails.DoctorUnavailableDays,
      DoctorBookedSlots: doctorBookedSlots,
    });
    
});

// ------------------------------------------------------------------------------------------------ Doctor Routes

// Get all appointments for a specific doctor
router.get('/doctor/:doctorId', auth , validate([
  param('doctorId').isInt().withMessage('Doctor ID must be an integer')
]), async (req, res) => {
  
    const { doctorId } = req.params;
    
    if (req.user.role !== 'doctor' || req.user.id !== parseInt(doctorId)) {
      return ApiResponse.error(res, 'Unauthorized access', 403);
    }

    let query = { AppointmentDoctorId: doctorId, AppointmentStatus: { $ne: 'cancelled'} };

    const appointments = await Appointment.find(query)
      .sort({ AppointmentStartDateTime: 1 });

    // Get patient details for each appointment
    const appointmentsWithPatientDetails = await Promise.all(appointments.map(async (appointment) => {
      const patient = await Patient.findOne({ PatientId: appointment.AppointmentPatientId });
      return {
        ...appointment.toObject(),
        patientName: patient?.PatientName
      };
    }));

    return ApiResponse.success(res, appointmentsWithPatientDetails);
});

// Doctor cancel appointment
router.post('/doctor/cancel/:appointmentId', auth , validate([
  param('appointmentId').isInt().withMessage('Appointment ID must be an integer')
]), async (req, res) => {
  
    const { appointmentId } = req.params;
    const doctorId = req.user.id;

    if (req.user.role !== 'doctor') {
      return ApiResponse.error(res, 'Only doctors can cancel their appointments', 403);
    }

    const appointment = await Appointment.findOne({
      AppointmentId: appointmentId,
      AppointmentDoctorId: doctorId
    });

    if (!appointment) {
      return ApiResponse.error(res, 'Appointment not found or unauthorized', 404);
    }

    if (!isValidStatusTransition(appointment.AppointmentStatus, 'cancelled')) {
      return ApiResponse.error(res, `Cannot cancel appointment with status: ${appointment.AppointmentStatus}`, 400);
    }

    // Check if appointment is in the future
    if (new Date(appointment.AppointmentStartDateTime) <= new Date()) {
      return ApiResponse.error(res, 'Cannot cancel past appointments', 400);
    }

    appointment.AppointmentStatus = APPOINTMENT_STATUS.CANCELLED;
    await appointment.save();

    // Get patient and doctor details for email
    const patient = await Patient.findOne({ PatientId: appointment.AppointmentPatientId }).lean();
    const doctor = await Doctor.findOne({ DoctorId: appointment.AppointmentDoctorId }).lean();

    // Send emails
    await EmailService.sendCancelledAppointmentEmail(appointment, patient, doctor);

    return ApiResponse.success(res, appointment, 'Appointment cancelled successfully');
});

// //Complete appointment
router.post('/complete/:appointmentId', auth , validate([
  param('appointmentId').isInt().withMessage('Appointment ID must be an integer')
]), async (req, res) => {
  
    const { appointmentId } = req.params;
    const patientId = req.user.id;

    const appointment = await Appointment.findOne({
      AppointmentId: appointmentId,
      AppointmentPatientId: patientId,
      AppointmentStatus: APPOINTMENT_STATUS.PENDING
    });

    if (!appointment) {
      return ApiResponse.error(res, 'Appointment not found or unauthorized', 404);
    }

    appointment.AppointmentStatus = APPOINTMENT_STATUS.COMPLETED;
    await appointment.save();

    // Get patient and doctor details for email
    const patient = await Patient.findOne({ PatientId: appointment.AppointmentPatientId }).lean();
    const doctor = await Doctor.findOne({ DoctorId: appointment.AppointmentDoctorId }).lean();

    // Send email to patient for feedback
    await EmailService.sendCompletedAppointmentEmail(appointment, patient, doctor);

    return ApiResponse.success(res, appointment, 'Appointment marked as completed');
});

// Recipt routes ------------------------------------------------------------------------------------------

// Get all receipts for a specific patient
router.get('/patient/receipts/:appointmentId', auth , validate([
  param('appointmentId').isInt().withMessage('Appointment ID must be an integer')
]), async (req, res) => {
  
    const { appointmentId } = req.params;

    if (req.user.role !== 'patient') {
      return ApiResponse.error(res, 'Unauthorized access', 403);
    }
    const appointment = await Appointment.findOne({ AppointmentId: appointmentId });
    if (!appointment) {
      return ApiResponse.error(res, 'Appointment not found', 404);
    }
    const doctor = await Doctor.findOne({ DoctorId: appointment.AppointmentDoctorId });
    const doctorDetail = await DoctorDetail.findOne({ DoctorId: appointment.AppointmentDoctorId });
    const invoiceNumber = `INV-${appointment.AppointmentId}-${appointment.AppointmentStartDateTime.toISOString().split('T')[0].split('-')[0]}`;
    // Mock receipt data for now
    const receipts = [{
      appointmentId: appointment.AppointmentId, 
      doctorName: doctor.DoctorName,
      specialty: doctor.DoctorSpecialization,
      date: appointment.AppointmentStartDateTime,
      time: appointment.AppointmentStartDateTime.toISOString().split('T')[1].substring(0,5),
      baseRate: doctorDetail.DoctorBaseRate.toLocaleString(),
      timePremium: (appointment.AppointmentCost - doctorDetail.DoctorBaseRate).toLocaleString(),
      totalAmount: appointment.AppointmentCost.toLocaleString(),
      invoiceNumber: invoiceNumber
    }];

    return ApiResponse.success(res, receipts);
});


module.exports = router;

