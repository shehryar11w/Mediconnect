const express = require('express');
const router = express.Router();
const Note = require('../models/Note');
const { auth } = require('../middleware/auth');
const { param, body } = require('express-validator');
const validate = require('../middleware/validator');
const ApiResponse = require('../utils/response');
const { NOTE_STATUS } = require('../utils/constants');

// Add a new note
router.post('/add', auth , validate([
  body('patientId').isInt().withMessage('Patient ID must be an integer'),
  body('content').notEmpty().withMessage('Content is required'),
  body('status').notEmpty().withMessage('Status is required')
]), async (req, res) => {
  
    const { patientId, content, status} = req.body;

    if (req.user.role !== 'doctor') {
      return ApiResponse.error(res, 'Only doctors can add notes', 403);
    }

    // Validate required fields
    if (!patientId || !content) {
      return ApiResponse.error(res, 'Patient ID and content are required', 400);
    }

    // Get the last note ID
    const lastNote = await Note.findOne().sort({ NoteId: -1 });
    const newNoteId = lastNote ? lastNote.NoteId + 1 : 1;

    const note = new Note({
      NoteId: newNoteId,
      NotePatientId: patientId,
      NoteContent: content,
      NoteStatus: status.toLowerCase(),
      NoteDateTime: new Date() // Auto-filled current date and time
    });

    await note.save();
    return ApiResponse.success(res, note, 'Note added successfully');
});

// Get all notes for a patient
router.get('/:patientId', auth , validate([
  param('patientId').isInt().withMessage('Patient ID must be an integer')
]), async (req, res) => {
  
    const { patientId } = req.params;

    let query = { NotePatientId: parseInt(patientId) };
    const notes = await Note.find(query)
      .sort({ NoteDateTime: -1 }); // Sort by date, newest first

    return ApiResponse.success(res, notes);
});

// Update note status
router.put('/status/:noteId', auth , validate([
  param('noteId').isInt().withMessage('Note ID must be an integer')
]), async (req, res) => {
  
    const { noteId } = req.params;
    const { status } = req.body;

    if (req.user.role !== 'doctor') {
      return ApiResponse.error(res, 'Only doctors can update note status', 403);
    }

    const validStatuses = Object.values(NOTE_STATUS);
    if (!validStatuses.includes(status)) {
      return ApiResponse.error(res, 'Invalid status. Must be general, symptoms, treatment, or follow-up', 400);
    }

    const note = await Note.findOne({ NoteId: parseInt(noteId) });
    if (!note) {
      return ApiResponse.error(res, 'Note not found', 404);
    }

    note.NoteStatus = status;
    await note.save();

    return ApiResponse.success(res, note, 'Note status updated successfully');
});

module.exports = router;
