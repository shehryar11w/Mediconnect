import api from "./api";

export const analyticsService = {
  getAnalytics: async (doctorId) => {
    try {
      const response = await api.get(`/analytics/${doctorId}/stats`);
      console.log(response.data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getTrends: async (doctorId) => {
    try {
      const response = await api.get(`/analytics/${doctorId}/trends`);
      console.log(response.data);
      return response.data;
    } catch (error) {
      console.log(JSON.parse(error.response.request.response).error);
      throw JSON.parse(error.response.request.response).error;
    }
  }
}; 