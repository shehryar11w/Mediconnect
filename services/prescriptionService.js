import api from "./api";

export const prescriptionService = {
  addPrescription: async (patientId, medicine, dosage, frequency, duration, notes) => {
    try {
      console.log(patientId, medicine, dosage, frequency, duration, notes);
      const response = await api.post('/prescriptions/doctor/add', {patientId, medicine, dosage, frequency, duration, notes});
      console.log(response.data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  DoctorGetAllPrescriptions: async (patientId) => {
    try {
      const response = await api.get(`/prescriptions/doctor/patient/${patientId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  PatientGetAllPrescriptions: async (patientId) => {
    try {
      const response = await api.get(`/prescriptions/patient/${patientId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  GetPrescriptionDetails: async (prescriptionId) => {
    try {
      const response = await api.get(`/prescriptions/patient/prescription/${prescriptionId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
} 