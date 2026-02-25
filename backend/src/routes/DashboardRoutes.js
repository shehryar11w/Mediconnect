const express = require('express');
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const Prescription = require('../models/Prescription');
const { auth } = require('../middleware/auth');
const { param } = require('express-validator');
const validate = require('../middleware/validator');
const ApiResponse = require('../utils/response');
const Doctor = require('../models/Doctor');
const PatientDetail = require('../models/PatientDetail');
const router = express.Router();

// Update push token
router.post('/update-push-token', auth, async (req, res) => {
  try {
    const { pushToken } = req.body;
    
    if (!pushToken) {
      return ApiResponse.error(res, 'Push token is required');
    }

    if (req.user.role !== 'patient') {
      return ApiResponse.error(res, 'Only patients can update push token', 403);
    }

    await Patient.findOneAndUpdate(
      { PatientId: req.user.id },
      { PushToken: pushToken }
    );

    return ApiResponse.success(res, { message: 'Push token updated successfully' });
  } catch (error) {
    return ApiResponse.error(res, error.message);
  }
});

// Get today's appointments for a specific doctor
router.get('/appointments/:doctorId', auth , validate([ 
  param('doctorId').isInt().withMessage('Doctor ID must be an integer')
]), async (req, res) => {
  try {
    const { doctorId } = req.params;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (req.user.role !== 'doctor' || req.user.id !== parseInt(doctorId)) {
      return ApiResponse.error(res, 'Unauthorized access', 403);
    }

    const appointments = await Appointment.find({
      AppointmentDoctorId: parseInt(doctorId),
      AppointmentStartDateTime: {
        $gte: today,
        $lt: tomorrow
      }
    })
    .select('AppointmentStartDateTime AppointmentPatientId AppointmentStatus')
    .sort({ AppointmentStartDateTime: 1 })
    .lean();
    
    const patientIds = appointments.map(a => a.AppointmentPatientId);
    const patients = await Patient.find({
      PatientId: { $in: patientIds }
    })
    .select('PatientName PatientEmail PatientId')
    .lean();
    
    const appointmentsWithPatients = appointments.map(appointment => ({
      ...appointment,
      patient: patients.find(p => p.PatientId === appointment.AppointmentPatientId)
    }));

    return ApiResponse.success(res, appointmentsWithPatients);
  } catch (error) {
    return ApiResponse.error(res, error.message);
  }
});

// Get total number of patients for a specific doctor
router.get('/total-patients/:doctorId', auth , validate([
  param('doctorId').isInt().withMessage('Doctor ID must be an integer')
]), async (req, res) => {
  
    const { doctorId } = req.params;
    
    if (req.user.role !== 'doctor' || req.user.id !== parseInt(doctorId)) {
      return ApiResponse.error(res, 'Unauthorized access', 403);
    }

    const uniquePatientIds = await Appointment.distinct('AppointmentPatientId', {
      AppointmentDoctorId: parseInt(doctorId)
    });

    return ApiResponse.success(res, { totalPatients: uniquePatientIds.length });

});

// Get recent patients for a specific doctor
router.get('/recent-patients/:doctorId', auth , validate([
  param('doctorId').isInt().withMessage('Doctor ID must be an integer')
]), async (req, res) => {
  
    const { doctorId } = req.params;
    
    if (req.user.role !== 'doctor' || req.user.id !== parseInt(doctorId)) {
      return ApiResponse.error(res, 'Unauthorized access', 403);
    }

    const recentAppointments = await Appointment.find({
      AppointmentDoctorId: parseInt(doctorId)
    })
    .sort({ AppointmentStartDateTime: -1 })
    .limit(5)
    .lean();

    const uniquePatientIds = [...new Set(recentAppointments.map(apt => apt.AppointmentPatientId))];
    
    const recentPatients = await Patient.find({
      PatientId: { $in: uniquePatientIds.map(id => parseInt(id)) }
    })
    .select('PatientName PatientEmail PatientId')
    .lean();

    return ApiResponse.success(res, recentPatients);
});

// Get next appointment for a specific patient
router.get('/next-appointment/:patientId', auth , validate([
  param('patientId').isInt().withMessage('Patient ID must be an integer')
]), async (req, res) => {
  
    const { patientId } = req.params;
    const now = new Date();

    if (req.user.role !== 'patient' || req.user.id !== parseInt(patientId)) {
      return ApiResponse.error(res, 'Unauthorized access', 403);
    }

    const nextAppointment = await Appointment.findOne({
      AppointmentPatientId: parseInt(patientId),
      AppointmentEndDateTime: { $gte: now },
      AppointmentStatus: { $nin: ['cancelled', 'completed', 'rescheduled'] }
    })
    .sort({ AppointmentStartDateTime: 1 })
    

    if (nextAppointment) {
      const doctor = await Doctor.findOne({ 
        DoctorId: parseInt(nextAppointment.AppointmentDoctorId)
      })
      .select('DoctorName')
      
      
      const appointmentWithDoctor = {
        ...nextAppointment,
        doctorName: doctor?.DoctorName
      };
      return ApiResponse.success(res, { appointment: appointmentWithDoctor });
    }

    return ApiResponse.success(res, null);
});

// Get all future appointments for a specific patient
router.get('/future-appointments/:patientId', auth , validate([
  param('patientId').isInt().withMessage('Patient ID must be an integer')
]), async (req, res) => {
  
    const { patientId } = req.params;
    const now = new Date();

    if (req.user.role !== 'patient' || req.user.id !== parseInt(patientId)) {
      return ApiResponse.error(res, 'Unauthorized access', 403);
    }

    const futureAppointments = await Appointment.find({
      AppointmentPatientId: parseInt(patientId),
      AppointmentStartDateTime: { $gte: now },
      AppointmentStatus: { $nin: ['cancelled', 'completed', 'rescheduled'] }
    })
    .sort({ AppointmentStartDateTime: 1 })
    .lean();

    const appointmentsWithDoctorDetails = await Promise.all(futureAppointments.map(async (appointment) => {
      const doctor = await Doctor.findOne({ 
        DoctorId: parseInt(appointment.AppointmentDoctorId)
      })
      .select('DoctorName')
      .lean();
      
      return {
        ...appointment,
        doctorName: doctor?.DoctorName
      };
    }));

    return ApiResponse.success(res, appointmentsWithDoctorDetails);
});

// Get active prescriptions for a specific patient
router.get('/active-prescriptions/:patientId', auth , validate([
  param('patientId').isInt().withMessage('Patient ID must be an integer')
]), async (req, res) => {
  
    const { patientId } = req.params;
    const now = new Date();

    if (req.user.role !== 'patient' || req.user.id !== parseInt(patientId)) {
      return ApiResponse.error(res, 'Unauthorized access', 403);
    }

    const allPrescriptions = await Prescription.find({
      PrescriptionPatientId: parseInt(patientId)
    }).lean();

    const activePrescriptions = allPrescriptions.filter(prescription => {
      const startDate = new Date(prescription.PrescriptionDate);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + prescription.PrescriptionDuration);
      return now <= endDate;
    });

    activePrescriptions.sort((a, b) => b.PrescriptionDate - a.PrescriptionDate);

    return ApiResponse.success(res, activePrescriptions);
});

// Get doctor name
router.get('/doctor-name/:doctorId', auth , validate([
  param('doctorId').isInt().withMessage('Doctor ID must be an integer')
]), async (req, res) => {
  
    const { doctorId } = req.params;

    if (req.user.role !== 'doctor' || req.user.id !== parseInt(doctorId)) {
      return ApiResponse.error(res, 'Unauthorized access', 403);
    }

    const doctor = await Doctor.findOne({DoctorId: doctorId});
    return ApiResponse.success(res, doctor);
});

// Get All patients for a specific doctor
router.get('/all-patients/:doctorId', auth , validate([
  param('doctorId').isInt().withMessage('Doctor ID must be an integer')
]), async (req, res) => {
  try {
    const { doctorId } = req.params;

    if (req.user.role !== 'doctor' || req.user.id !== parseInt(doctorId)) {
      return ApiResponse.error(res, 'Unauthorized access', 403);
    }

    const recentAppointments = await Appointment.find({
      AppointmentDoctorId: parseInt(doctorId)
    }).sort({ AppointmentStartDateTime: -1 }).lean();

    const uniquePatientIds = [...new Set(recentAppointments.map(apt => apt.AppointmentPatientId))];

    const patients = await Patient.find({
      PatientId: { $in: uniquePatientIds }
    }).lean();

    const patientDetails = await PatientDetail.find({
      PatientId: { $in: uniquePatientIds }
    }).lean();

    // Map details for fast lookup
    const detailsMap = new Map();
    patientDetails.forEach(detail => {
      detailsMap.set(detail.PatientId, detail);
    });

    // Merge and filter fields
    const patientsWithDetails = patients.map(patient => {
      const detail = detailsMap.get(patient.PatientId) || {};
      return {
        PatientId: patient.PatientId,
        PatientName: patient.PatientName,
        PatientAge: detail.PatientAge || null,
        PatientGender: detail.PatientGender || null,
        PatientMedicalRecord: detail.PatientMedicalRecord || null
      };
    });

    return ApiResponse.success(res, patientsWithDetails);
  } catch (error) {
    return ApiResponse.error(res, error.message);
  }
});



// Get doctor dashboard data
// router.get('/doctor/:doctorId', auth, async (req, res) => {
//     try {
//         const { doctorId } = req.params;

//         if (req.user.role !== 'doctor' || req.user.id !== parseInt(doctorId)) {
//             return res.status(403).json({ message: 'Unauthorized access' });
//         }

//         // Get today's appointments
//         const today = new Date();
//         today.setHours(0, 0, 0, 0);
//         const tomorrow = new Date(today);
//         tomorrow.setDate(tomorrow.getDate() + 1);

//         const todayAppointments = await Appointment.find({
//             AppointmentDoctorId: doctorId,
//             AppointmentStartDateTime: {
//                 $gte: today,
//                 $lt: tomorrow
//             }
//         }).sort({ AppointmentStartDateTime: 1 });

//         // Get upcoming appointments
//         const upcomingAppointments = await Appointment.find({
//             AppointmentDoctorId: doctorId,
//             AppointmentStartDateTime: { $gt: tomorrow },
//             AppointmentStatus: 'active'
//         }).sort({ AppointmentStartDateTime: 1 }).limit(5);

//         // Get total patients
//         const uniquePatients = await Appointment.distinct('AppointmentPatientId', {
//             AppointmentDoctorId: doctorId
//         });

//         res.json({
//             todayAppointments,
//             upcomingAppointments,
//             totalPatients: uniquePatients.length
//         });
//     } catch (error) {
//         res.status(500).json({ message: 'Error fetching dashboard data', error: error.message });
//     }
// });

// // Get patient dashboard data
// router.get('/patient/:patientId', auth, async (req, res) => {
//     try {
//         const { patientId } = req.params;

//         if (req.user.role !== 'patient' || req.user.id !== parseInt(patientId)) {
//             return res.status(403).json({ message: 'Unauthorized access' });
//         }

//         // Get today's appointments
//         const today = new Date();
//         today.setHours(0, 0, 0, 0);
//         const tomorrow = new Date(today);
//         tomorrow.setDate(tomorrow.getDate() + 1);

//         const todayAppointments = await Appointment.find({
//             AppointmentPatientId: patientId,
//             AppointmentStartDateTime: {
//                 $gte: today,
//                 $lt: tomorrow
//             }
//         }).sort({ AppointmentStartDateTime: 1 });

//         // Get upcoming appointments
//         const upcomingAppointments = await Appointment.find({
//             AppointmentPatientId: patientId,
//             AppointmentStartDateTime: { $gt: tomorrow },
//             AppointmentStatus: 'active'
//         }).sort({ AppointmentStartDateTime: 1 }).limit(5);

//         // Get recent doctors
//         const recentDoctors = await Appointment.distinct('AppointmentDoctorId', {
//             AppointmentPatientId: patientId
//         });

//         const doctors = await Doctor.find({
//             DoctorId: { $in: recentDoctors }
//         }).select('DoctorName DoctorSpecialization');

//         res.json({
//             todayAppointments,
//             upcomingAppointments,
//             recentDoctors: doctors
//         });
//     } catch (error) {
//         res.status(500).json({ message: 'Error fetching dashboard data', error: error.message });
//     }
// });

module.exports = router; 