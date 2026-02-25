import api from "./api";

export const notesService = {
  addNotes: async (patientId, content, status) => {
    try {
      const response = await api.post(`/notes/add`, {patientId, content, status});
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  getNotes: async (patientId) => {
    try {
      const response = await api.get(`/notes/${patientId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  updateNoteStatus: async (noteId, status) => {
    try {
      const response = await api.put(`/status/${noteId}`, status);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
}