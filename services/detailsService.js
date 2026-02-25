import api from "./api";

const detailsService = {
  addPatientDetails: async (patientId, age,gender,bloodGroup,emergencyContact,medicalRecord,height,weight) => {
    try {
      const response = await api.post(`/details/patient/${patientId}`, age,gender,bloodGroup,emergencyContact,medicalRecord,height,weight);
      console.log(response.data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  updatePatientDetails: async (patientId, updatedDetails) => {
    try {
      const response = await api.put(`/details/patient/${patientId}`, updatedDetails);
      console.log(response.data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  getPatientDetails: async (patientId) => {
    try {
      const response = await api.get(`/details/patient/${patientId}`);
      console.log(response.data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  addDoctorDetails: async (doctorId, address,baseRate,workingHours,workingDays,unavailableDays,education) => {
    try {
      const response = await api.post(`/details/doctor/${doctorId}`, address,baseRate,workingHours,workingDays,unavailableDays,education);
      console.log(response.data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  updateDoctorDetails: async (doctorId, updatedDetails) => {
    try {
      const response = await api.put(`/details/doctor/${doctorId}`, updatedDetails);
      console.log(response.data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  getDoctorDetails: async (doctorId) => {
    try {
      const response = await api.get(`/details/doctor/${doctorId}`);
      console.log(response.data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  
}; 
export default detailsService;