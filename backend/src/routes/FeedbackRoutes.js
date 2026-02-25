const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');
const Appointment = require('../models/Appointment');
const { auth } = require('../middleware/auth');
const { param, body } = require('express-validator');
const validate = require('../middleware/validator');
const ApiResponse = require('../utils/response');
const Patient = require('../models/Patient');

// Doctor Routes

// Get overall rating for a doctor
router.get('/doctor/rating/:doctorId', auth , validate([
  param('doctorId').isInt().withMessage('Doctor ID must be an integer')
]), async (req, res) => {
  
    const { doctorId } = req.params;

    // Get all feedback for the doctor's appointments
    const feedbacks = await Feedback.aggregate([
      {
        $lookup: {
          from: 'appointments',
          localField: 'FeedbackAppointmentId',
          foreignField: 'AppointmentId',
          as: 'appointment'
        }
      },
      {
        $match: {
          'appointment.AppointmentDoctorId': parseInt(doctorId)
        }
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$FeedbackRating' },
          totalReviews: { $sum: 1 },
          ratingDistribution: {
            $push: '$FeedbackRating'
          }
        }
      }
    ]);

    if (feedbacks.length === 0) {
      return ApiResponse.success(res, {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: {
          1: 0, 2: 0, 3: 0, 4: 0, 5: 0
        }
      });
    }

    const result = feedbacks[0];
    const distribution = result.ratingDistribution.reduce((acc, rating) => {
      acc[rating] = (acc[rating] || 0) + 1;
      return acc;
    }, { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });

    return ApiResponse.success(res, {
      averageRating: parseFloat(result.averageRating.toFixed(1)),
      totalReviews: result.totalReviews,
      ratingDistribution: distribution
    });
});

// Get all reviews for a doctor
router.get('/doctor/reviews/:doctorId', auth , validate([
  param('doctorId').isInt().withMessage('Doctor ID must be an integer')
]), async (req, res) => {
  
    const { doctorId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const feedbacks = await Feedback.aggregate([
      {
        $lookup: {
          from: 'appointments',
          localField: 'FeedbackAppointmentId',
          foreignField: 'AppointmentId',
          as: 'appointment'
        }
      },
      {
        $match: {
          'appointment.AppointmentDoctorId': parseInt(doctorId)
        }
      },
      {
        $lookup: {
          from: 'patients',
          localField: 'appointment.AppointmentPatientId',
          foreignField: 'PatientId',
          as: 'patient'
        }
      },
      {
        $project: {
          _id: 0,
          feedbackId: '$FeedbackId',
          rating: '$FeedbackRating',
          comment: '$FeedbackComment',
          patientName: { $arrayElemAt: ['$patient.PatientName', 0] },
          appointmentDate: { $arrayElemAt: ['$appointment.AppointmentStartDateTime', 0] }
        }
      },
      {
        $sort: { appointmentDate: -1 }
      },
      {
        $skip: (page - 1) * limit
      },
      {
        $limit: parseInt(limit)
      }
    ]);

    const total = await Feedback.aggregate([
      {
        $lookup: {
          from: 'appointments',
          localField: 'FeedbackAppointmentId',
          foreignField: 'AppointmentId',
          as: 'appointment'
        }
      },
      {
        $match: {
          'appointment.AppointmentDoctorId': parseInt(doctorId)
        }
      },
      {
        $count: 'total'
      }
    ]);

    return ApiResponse.success(res, {
      reviews: feedbacks,
      totalReviews: total[0]?.total || 0,
      currentPage: parseInt(page),
      totalPages: Math.ceil((total[0]?.total || 0) / limit)
    });
});

// Patient Routes

// Get all previous appointments for rating
router.get('/patient/appointments/:patientId', auth , validate([
  param('patientId').isInt().withMessage('Patient ID must be an integer')
]), async (req, res) => {
  
    const { patientId } = req.params;

    const appointments = await Appointment.aggregate([
      {
        $match: {
          AppointmentPatientId: parseInt(patientId),
          AppointmentStatus: 'completed'
        }
      },
      {
        $lookup: {
          from: 'doctors',
          localField: 'AppointmentDoctorId',
          foreignField: 'DoctorId',
          as: 'doctor'
        }
      },
      {
        $lookup: {
          from: 'feedbacks',
          localField: 'AppointmentId',
          foreignField: 'FeedbackAppointmentId',
          as: 'feedback'
        }
      },
      {
        $project: {
          _id: 0,
          appointmentId: '$AppointmentId',
          doctorName: { $arrayElemAt: ['$doctor.DoctorName', 0] },
          doctorId: '$AppointmentDoctorId',
          date: '$AppointmentStartDateTime',
          reason: '$AppointmentReason',
          doctorSpecialization: { $arrayElemAt: ['$doctor.DoctorSpecialization', 0] },
          hasFeedback: {
            $cond: {
              if: { $gt: [{ $size: '$feedback' }, 0] },
              then: true,
              else: false
            }
          },
          rating: { $arrayElemAt: ['$feedback.FeedbackRating', 0] }
        }
      },
      {
        $sort: { date: -1 }
      }
    ]);
    console.log(appointments);
    return ApiResponse.success(res, appointments);
});

// Submit feedback for an appointment
router.post('/patient/submit', auth , validate([
  body('appointmentId').isInt().withMessage('Appointment ID must be an integer'),
  body('rating').isInt().withMessage('Rating must be an integer'),
  body('comment').notEmpty().withMessage('Comment is required')
]), async (req, res) => {
  
    if (req.user.role !== 'patient') {
      return ApiResponse.error(res, 'Only patients can submit feedback', 403);
    }

    const { appointmentId, rating, comment } = req.body;
    const patientId = req.user.id;

    // Validate rating
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // Verify appointment exists and belongs to the patient
    const appointment = await Appointment.findOne({
      AppointmentId: appointmentId,
      AppointmentPatientId: patientId,
      AppointmentStatus: 'completed'
    });

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found or not completed' });
    }

    // Check if feedback already exists
    const existingFeedback = await Feedback.findOne({
      FeedbackAppointmentId: appointmentId
    });

    if (existingFeedback) {
      return res.status(400).json({ message: 'Feedback already submitted for this appointment' });
    }

    // Get the last feedback ID
    const lastFeedback = await Feedback.findOne().sort({ FeedbackId: -1 });
    const newFeedbackId = lastFeedback ? lastFeedback.FeedbackId + 1 : 1;

    const feedback = new Feedback({
      FeedbackId: newFeedbackId,
      FeedbackAppointmentId: appointmentId,
      FeedbackRating: rating,
      FeedbackComment: comment
    });

    await feedback.save();
    return ApiResponse.success(res, feedback, 'Feedback submitted successfully');
});

// Get feedback details
router.get('/doctor/feedback/:feedbackId', auth , validate([
  param('feedbackId').isInt().withMessage('Feedback ID must be an integer')
]), async (req, res) => {
  
    const { feedbackId } = req.params;

    const feedback = await Feedback.findOne({ FeedbackId: feedbackId });

    if (!feedback) {
      return ApiResponse.error(res, 'Feedback not found', 404);
    }

    const appointment = await Appointment.findOne({ AppointmentId: feedback.FeedbackAppointmentId });
    if (!appointment) {
      return ApiResponse.error(res, 'Associated appointment not found', 404);
    }

    const patient = await Patient.findOne({ PatientId: appointment.AppointmentPatientId });
    if (!patient) {
      return ApiResponse.error(res, 'Associated patient not found', 404);
    }

    const formattedFeedback = {
      id: feedback.FeedbackId.toString(),
      patientName: patient.PatientName,
      rating: feedback.FeedbackRating,
      comment: feedback.FeedbackComment,
      date: feedback.createdAt.toISOString().split('T')[0],
      appointmentDate: appointment.AppointmentStartDateTime.toISOString().split('T')[0],
      appointmentTime: appointment.AppointmentStartDateTime.toISOString().split('T')[1].substring(0,5)
    };
    return ApiResponse.success(res, formattedFeedback);
});



module.exports = router;

