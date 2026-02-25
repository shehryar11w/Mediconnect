import api from "./api";

export const feedbackService = {
  getDoctorRating: async (doctorId) => {
    try {
      const response = await api.get(`/feedback/doctor/rating/${doctorId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  getAllDoctorReviews: async (doctorId) => {
    try {
      const response = await api.get(`/feedback/doctor/reviews/${doctorId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  getPatientAppointments: async (patientId) => {
    try {
      const response = await api.get(`/feedback/patient/appointments/${patientId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  submitPatientFeedback: async (appointmentId, rating, comment) => {
    try {
      const response = await api.post(`/feedback/patient/submit`, appointmentId, rating, comment);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  getFeedbackDetails: async (feedbackId) => {
    try {
      const response = await api.get(`/feedback/doctor/feedback/${feedbackId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
}