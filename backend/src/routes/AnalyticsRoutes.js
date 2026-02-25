const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const Feedback = require('../models/Feedback');
const { auth } = require('../middleware/auth');
const { param } = require('express-validator');
const validate = require('../middleware/validator');
const ApiResponse = require('../utils/response');
const { APPOINTMENT_STATUS } = require('../utils/constants');

// Get overall statistics for a specific doctor
router.get('/:doctorId/stats', auth, validate([
    param('doctorId').isInt().withMessage('Doctor ID must be an integer')
]), async (req, res) => {
    // Check if the requesting user is the doctor
    if (req.user.role !== 'doctor' || req.user.id !== parseInt(req.params.doctorId)) {
        return ApiResponse.error(res, 'Unauthorized access', 403);
    }

    const { doctorId } = req.params;

    // Get total patients (unique patients who have appointments)
    const uniquePatients = await Appointment.distinct('AppointmentPatientId', {
        AppointmentDoctorId: doctorId
    });
    const totalPatients = uniquePatients.length;

    // Get average rating
    const appointments = await Appointment.find({ AppointmentDoctorId: doctorId });
    const appointmentIds = appointments.map(apt => apt.AppointmentId);
    const feedbacks = await Feedback.find({ FeedbackAppointmentId: { $in: appointmentIds } });
    
    const averageRating = feedbacks.length > 0
        ? feedbacks.reduce((acc, curr) => acc + curr.FeedbackRating, 0) / feedbacks.length
        : 0;

    // Get total revenue
    const totalRevenue = appointments.reduce((acc, curr) => 
      curr.AppointmentStatus !== APPOINTMENT_STATUS.CANCELLED ? acc + curr.AppointmentCost : acc, 0);

    return ApiResponse.success(res, {
        totalPatients,
        averageRating: parseFloat(averageRating.toFixed(2)),
        totalRevenue
    });
});

// Get revenue and satisfaction trends
router.get('/:doctorId/trends', auth, validate([
    param('doctorId').isInt().withMessage('Doctor ID must be an integer')
    ]), async (req, res) => {
    // Check if the requesting user is the doctor
    if (req.user.role !== 'doctor' || req.user.id !== parseInt(req.params.doctorId)) {
        return ApiResponse.error(res, 'Unauthorized access', 403);
    }

    const { doctorId } = req.params;
    const { period = 'month' } = req.query; // month, week, or year

    // Get all appointments for the doctor
    const appointments = await Appointment.find({ AppointmentDoctorId: doctorId });
    const appointmentIds = appointments.map(apt => apt.AppointmentId);
    const feedbacks = await Feedback.find({ FeedbackAppointmentId: { $in: appointmentIds } });

    // Initialize data structure for trends
    const trends = {
        revenue: [],
        satisfaction: []
    };

    // Group data by time period
    const groupedData = {};
    appointments.forEach(apt => {
        if (apt.AppointmentStatus !== APPOINTMENT_STATUS.CANCELLED) {
            const date = new Date(apt.AppointmentStartDateTime);
            let key;
            
            if (period === 'week') {
                key = `${date.getFullYear()}-W${Math.ceil((date.getDate() + date.getDay()) / 7)}`;
            } else if (period === 'month') {
                key = `${date.getFullYear()}-${date.getMonth() + 1}`;
            } else {
                key = date.getFullYear();
            }

            if (!groupedData[key]) {
                groupedData[key] = {
                    revenue: 0,
                    ratings: []
                };
            }
            groupedData[key].revenue += apt.AppointmentCost;
        }
    });

    // Add ratings to grouped data
    feedbacks.forEach(feedback => {
        const apt = appointments.find(a => a.AppointmentId === feedback.FeedbackAppointmentId);
        if (apt) {
            const date = new Date(apt.AppointmentStartDateTime);
            let key;
            
            if (period === 'week') {
                key = `${date.getFullYear()}-W${Math.ceil((date.getDate() + date.getDay()) / 7)}`;
            } else if (period === 'month') {
                key = `${date.getFullYear()}-${date.getMonth() + 1}`;
            } else {
                key = date.getFullYear();
            }

            if (groupedData[key]) {
                groupedData[key].ratings.push(feedback.FeedbackRating);
            }
        }
    });

    // Convert grouped data to arrays
    Object.keys(groupedData).sort().forEach(key => {
        const data = groupedData[key];
        trends.revenue.push({
            period: key,
            amount: data.revenue
        });

        const avgRating = data.ratings.length > 0
            ? data.ratings.reduce((acc, curr) => acc + curr, 0) / data.ratings.length
            : 0;

        trends.satisfaction.push({
            period: key,
            rating: parseFloat(avgRating.toFixed(2))
        });
    });

    return ApiResponse.success(res, trends);
});

module.exports = router;
