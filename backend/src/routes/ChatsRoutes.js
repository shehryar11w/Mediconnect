const express = require('express');
const { auth } = require('../middleware/auth');
const { body, param } = require('express-validator');
const validate = require('../middleware/validator');
const ApiResponse = require('../utils/response');
const ChatService = require('../services/ChatService');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const router = express.Router();

// Get all chats for a user (doctor or patient)
router.get('/list', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const chats = await ChatService.getUserChats(userId, userRole);

    const chatsWithDetails = await Promise.all(chats.map(async (chat) => {
      const lastMessage = await ChatService.getLastMessage(chat.ChatId);
      let details = {};

      if (userRole === 'patient') {
        const doctor = await Doctor.findOne({ DoctorId: chat.AppointmentDoctorId }).lean();
        details = {
          doctorName: doctor?.DoctorName,
          doctorSpecialization: doctor?.DoctorSpecialization
        };
      } else {
        const patient = await Patient.findOne({ PatientId: chat.AppointmentPatientId }).lean();
        details = {
          patientName: patient?.PatientName
        };
      }

      return {
        ...chat,
        ...details,
        lastMessageTime: lastMessage?.MessageSentAt,
        lastMessageRead: lastMessage?.MessageRead || false
      };
    }));

    return ApiResponse.success(res, { chats: chatsWithDetails });
  } catch (error) {
    return ApiResponse.error(res, error.message);
  }
});

// Get messages for a specific chat
router.get('/:chatId/messages', auth, validate([
  param('chatId').isInt().withMessage('Chat ID must be an integer')
]), async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;

    // Verify chat access
    await ChatService.verifyChatAccess(chatId, userId);

    // Get messages
    const messages = await ChatService.getChatMessages(chatId);

    // Mark messages as read
    await ChatService.markMessagesAsRead(chatId, req.user.role);

    return ApiResponse.success(res, { messages });
  } catch (error) {
    return ApiResponse.error(res, error.message);
  }
});

// Get chat details
router.get('/:chatId/details', auth, validate([
  param('chatId').isInt().withMessage('Chat ID must be an integer')
]), async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Verify chat access
    const chat = await ChatService.verifyChatAccess(chatId, userId);
    let details = {};

    if (userRole === 'patient') {
      const doctor = await Doctor.findOne({ DoctorId: chat.AppointmentDoctorId }).lean();
      details = {
        doctorName: doctor?.DoctorName,
        doctorSpecialization: doctor?.DoctorSpecialization,
        doctorEmail: doctor?.DoctorEmail,
        doctorPhone: doctor?.DoctorPhone
      };
    } else {
      const patient = await Patient.findOne({ PatientId: chat.AppointmentPatientId }).lean();
      details = {
        patientName: patient?.PatientName,
        patientEmail: patient?.PatientEmail,
        patientPhone: patient?.PatientPhone
      };
    }

    return ApiResponse.success(res, {
      chatDetails: {
        ...chat,
        ...details,
      }
    });
  } catch (error) {
    return ApiResponse.error(res, error.message);
  }
});

// Send a new message
router.post('/:chatId/messages', auth, validate([
  param('chatId').isInt().withMessage('Chat ID must be an integer'),
  body('content').notEmpty().withMessage('Message content is required')
]), async (req, res) => {
  try {
    const { chatId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    const message = await ChatService.createMessage(chatId, userId, userRole, content);
    return ApiResponse.success(res, { message });
  } catch (error) {
    return ApiResponse.error(res, error.message);
  }
});

// Update typing status
router.post('/:chatId/typing', auth, validate([
  param('chatId').isInt().withMessage('Chat ID must be an integer'),
  body('isTyping').isBoolean().withMessage('isTyping must be a boolean')
]), async (req, res) => {
  try {
    const { chatId } = req.params;
    const { isTyping } = req.body;
    const userId = req.user.id;

    // Verify chat access
    await ChatService.verifyChatAccess(chatId, userId);

    return ApiResponse.success(res, { isTyping });
  } catch (error) {
    return ApiResponse.error(res, error.message);
  }
});

module.exports = router;
