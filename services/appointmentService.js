import api from "./api";

export const appointmentService = {
  cancelPatientAppointment: async (appointmentId) => {
    try {
      const response = await api.post(`/appointments/patient/cancel/${appointmentId}`);
      console.log(response.data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  rescheduleAppointment: async (appointmentId, newStartDateTime, newEndDateTime,newCost) => {
    try {
      const response = await api.put(`/appointments/patient/reschedule/${appointmentId}`, { newStartDateTime, newEndDateTime,newCost});
      return response.data;
    } catch (error) {
      console.log(JSON.parse(error.response.request.response).error);
      throw JSON.parse(error.response.request.response).error;
    }
  },
  getDoctors: async () => {
    try {
      const response = await api.get(`/appointments/doctors`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  getAppointments: async (doctorId) => {
    try {
      const response = await api.get(`/appointments/doctor/${doctorId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  cancelDoctorAppointment: async (appointmentId) => {
    try {
      const response = await api.post(`/appointments/doctor/cancel/${appointmentId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  completeAppointment: async (appointmentId) => {
    try {
      const response = await api.post(`/appointments/complete/${appointmentId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  createAppointment: async (doctorId, startDateTime, endDateTime, reason, cost) => {
    try {
      console.log('doctorId', doctorId);
      console.log('startDateTime', startDateTime);
      console.log('endDateTime', endDateTime);
      console.log('reason', reason);
      console.log('cost', cost);
      const response = await api.post(`/appointments/patient/createAppointment`, { doctorId, startDateTime, endDateTime, reason, cost });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  getPatientAppointments: async (patientId) => {
    try {
      const response = await api.get(`/appointments/patient/${patientId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  getAppointment: async (appointmentId) => {
    try {
      const response = await api.get(`/appointments/${appointmentId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  getReceipt: async (appointmentId) => {
    try {
      const response = await api.get(`/appointments/patient/receipts/${appointmentId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
}; 