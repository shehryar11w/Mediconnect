const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Report = require('../models/Report');
const Patient = require('../models/Patient');
const { auth } = require('../middleware/auth');
const { param, body } = require('express-validator');
const validate = require('../middleware/validator');
const fileService = require('../services/fileService');
const ApiResponse = require('../utils/response');
const { REPORT_TYPES } = require('../utils/constants');

// Ensure uploads directory exists
const uploadDir = path.join(process.cwd(), 'src/uploads/reports');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed!'), false);
        }
    }
});

// Doctor Routes

// Get all reports for a specific patient
router.get('/doctor/patient/:patientId', auth, validate([
    param('patientId').isInt().withMessage('Patient ID must be an integer')
]), async (req, res, next) => {
    if (req.user.role !== 'doctor') {
        return ApiResponse.error(res, 'Only doctors can access patient reports', 403);
    }

    const { patientId } = req.params;
    const { type } = req.query;

    // Validate patient exists
    const patient = await Patient.findOne({ PatientId: parseInt(patientId) });
    if (!patient) {
        return ApiResponse.error(res, 'Patient not found', 404);
    }

    // Build query
    const query = { ReportPatientId: parseInt(patientId) };
    if (type && Object.values(REPORT_TYPES).includes(type)) {
        query.ReportType = type;
    }

    const reports = await Report.find(query)
        .sort({ ReportDate: -1 });

    return ApiResponse.success(res, reports);
});

// Patient Routes

// Upload new report
router.post('/patient/upload', auth, validate([
    body('description').optional().isString().withMessage('Description must be a string'),
    body('title').optional().isString().withMessage('Title must be a string'),
    body('type').optional().isString().withMessage('Type must be a string')
]), upload.single('report'), async (req, res) => {
    if (req.user.role !== 'patient') {
        return ApiResponse.error(res, 'Only patients can upload reports', 403);
    }
    if (!req.file) {
        return ApiResponse.error(res, 'No report file uploaded', 400);
    }
    console.log(req.file);
    console.log(req.body);
    try {
        fileService.validateFile(req.file);
    } catch (err) {
        return ApiResponse.error(res, err.message || 'Invalid file', 400);
    }

    const { type,description, title } = req.body;
    const patientId = req.user.id;

    // Save file
    const filename = await fileService.saveFile(req.file, 'reports');

    // Get the last report ID
    const lastReport = await Report.findOne().sort({ ReportId: -1 });
    const reportId = lastReport ? lastReport.ReportId + 1 : 1;

    // Create report record
    const report = new Report({
        ReportId: reportId,
        ReportPatientId: patientId,
        ReportType: type,
        ReportFile: filename,
        ReportTitle: title,
        ReportDate: new Date(),
        ReportDescription: description
    });

    await report.save();
    return ApiResponse.success(res, report, 'Report uploaded successfully', 201);
});

// Get all reports for the logged-in patient
router.get('/patient/reports', auth, async (req, res, next) => {
    if (req.user.role !== 'patient') {
        return ApiResponse.error(res, 'Only patients can access their reports', 403);
    }

    const patientId = req.user.id;
    const { type } = req.query;

    // Build query
    const query = { ReportPatientId: patientId };
    if (type && Object.values(REPORT_TYPES).includes(type)) {
        query.ReportType = type;
    }

    const reports = await Report.find(query)
        .sort({ ReportDate: -1 });

    return ApiResponse.success(res, reports);
});

// Download report
router.get('/download/:reportId', auth, async (req, res, next) => {
    const { reportId } = req.params;
    const report = await Report.findOne({ ReportId: parseInt(reportId) });

    if (!report) {
        return ApiResponse.error(res, 'Report not found', 404);
    }

    // Check authorization
    if (req.user.role === 'patient' && report.ReportPatientId !== req.user.id) {
        return ApiResponse.error(res, 'Unauthorized access', 403);
    }

    const fileBuffer = await fileService.getFileStream(report.ReportFile, 'reports');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${report.ReportFile}`);
    return res.send(fileBuffer);
});

module.exports = router;
