import api from './api'; // Assuming this path is correct based on your structure

const dashboardService = {
  // 🩺 Doctor: Get today's appointments
  getTodaysAppointments: async (doctorId) => {
    try {
      const response = await api.get(`/dashboard/appointments/${doctorId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // 🩺 Doctor: Get total number of patients
  getTotalPatients: async (doctorId) => {
    try {
      const response = await api.get(`/dashboard/total-patients/${doctorId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // 🩺 Doctor: Get recent patients
  getRecentPatients: async (doctorId) => {
    try {
      const response = await api.get(`/dashboard/recent-patients/${doctorId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // 🧑‍⚕️ Patient: Get next appointment
  getNextAppointment: async (patientId) => {
    try {
      const response = await api.get(`/dashboard/next-appointment/${patientId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // 🧑‍⚕️ Patient: Get future appointments
  getFutureAppointments: async (patientId) => {
    try {
      const response = await api.get(`/dashboard/future-appointments/${patientId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // 🧑‍⚕️ Patient: Get active prescriptions
  getActivePrescriptions: async (patientId) => {
    try {
      const response = await api.get(`/dashboard/active-prescriptions/${patientId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getDoctorData: async (doctorId) => {
    try {
      const response = await api.get(`/dashboard/doctor-name/${doctorId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  getAllPatients: async (doctorId) => {
    try {
      const response = await api.get(`/dashboard/all-patients/${doctorId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // // Optional full dashboard for doctor
  // getDoctorDashboard: async (doctorId) => {
  //   try {
  //     const response = await api.get(`/dashboard/doctor/${doctorId}`);
  //     return response.data;
  //   } catch (error) {
  //     throw error.response?.data || error.message;
  //   }
  // },

  // // Optional full dashboard for patient
  // getPatientDashboard: async (patientId) => {
  //   try {
  //     const response = await api.get(`/dashboard/patient/${patientId}`);
  //     return response.data;
  //   } catch (error) {
  //     throw error.response?.data || error.message;
  //   }
  // },
};

export default dashboardService;
