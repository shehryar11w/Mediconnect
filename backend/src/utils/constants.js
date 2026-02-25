module.exports = {
  // User Roles
  ROLES: {
    DOCTOR: 'doctor',
    PATIENT: 'patient'
  },

  // Appointment Status
  APPOINTMENT_STATUS: {
    PENDING: 'pending',
    COMPLETED: 'completed',
    RESCHEDULED: 'rescheduled',
    CANCELLED: 'cancelled'
  },

  // Report Types
  REPORT_TYPES: {
    LAB: 'lab',
    IMAGING: 'imaging',
    CONSULTATION: 'consultation',
    FORMS: 'forms'
  },

  // Note Status
  NOTE_STATUS: {
    GENERAL: 'general',
    SYMPTOMS: 'symptoms',
    TREATMENT: 'treatment',
    FOLLOW_UP: 'follow-up'
  },

  // File Upload
  FILE_UPLOAD: {
    MAX_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_TYPES: ['application/pdf']
  },

  // Pagination
  PAGINATION: {
    DEFAULT_LIMIT: 10,
    DEFAULT_PAGE: 1
  },

  // JWT
  JWT: {
    EXPIRES_IN: '24h'
  }
}; 