import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Sharing from 'expo-sharing';
import api from "./api";

export const reportService = {
  DoctorGetReports: async (patientId) => {
    try {
      const response = await api.get(`/reports/doctor/patient/${patientId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  addReport: async (file, type, description, title) => {
    try {
      const formData = new FormData();
      formData.append('report', file);
      formData.append('type', type);
      formData.append('description', description);
      formData.append('title', title);
      console.log('formData', formData);
      const response = await api.post('/reports/patient/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      console.log(error);
      throw error.response?.data || error.message;
    }
  },
  PatientGetReports: async (type = null ) => {
    try {
      const url = type
        ? `/reports/patient/reports?type=${type}`
        : `/reports/patient/reports`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  downloadReport: async (reportId) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const fileUri = FileSystem.documentDirectory + `report-${reportId}.pdf`;

      const downloadResumable = FileSystem.createDownloadResumable(
        `${api.defaults.baseURL}/reports/download/${reportId}`,
        fileUri,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/pdf',
          },
        }
      );

      const { uri } = await downloadResumable.downloadAsync();
      
      // First share the file
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Open PDF Report',
        UTI: 'com.adobe.pdf'
      });

      // Then get a content URI for opening
      const contentUri = await FileSystem.getContentUriAsync(uri);
      
      // Open the PDF using the content URI
      await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
        data: contentUri,
        type: 'application/pdf',
        flags: 1,
      });

      return { success: true, data: { url: contentUri } };
    } catch (error) {
      console.error('Download error:', error);
      throw error.response?.data || error.message;
    }
  }
};