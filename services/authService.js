import api from "./api";

export const authService = {
  doctorLogin: async (email, password) => {
    try {
      const response = await api.post('/auth/doctorLogin', { email, password });
      return response.data;
    } catch (error) {
      throw error.response.data.message;
    }
  },

  patientLogin: async (email, password) => {
    try {
      const response = await api.post('/auth/patientLogin', { email, password });
      return response.data;
    } catch (error) {
      throw error.response.data.message;
    }
  },

  doctorRegister: async (email, password, name,phone,specialization) => {
    try {
      const response = await api.post('/auth/doctorRegister', { email, password, name,phone,specialization });
      return response.data;
    } catch (error) {
      throw error.response.data.message;
    }
  },
  patientRegister: async (email, password, name,phone) => {
    try {
      const response = await api.post('/auth/patientRegister', { email, password, name,phone });
      return response.data;
    } catch (error) {
      throw error.response.data.message;
    }
  },
  validateToken: async (token) => {
    try {
      const response = await api.get(`/auth/validate-token?token=${token}`);
      return response.data;
    } catch (error) {
      throw error.response.data.message;
    }
  },
  sendResetCode: async (email) => {
    try {
      const response = await api.post('/auth/forgotPassword', { email });
      return response.data;
    } catch (error) {
      throw error.response.data.message;
    }
  },
  verifyResetCode: async (token) => {
    try {
      const response = await api.post('/auth/verifyToken', { token });
      return response.data;
    } catch (error) {
      throw error.response.data.message;
    }
  },
  resetPassword: async (password,userRole,userId) => {
    try {
      const response = await api.post('/auth/resetPassword', { password,userRole,userId });
      return response.data;
    } catch (error) {
      throw error.response.data.message;
    } 
  }
}; 