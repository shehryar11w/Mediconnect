import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from "axios";

const api = axios.create({
  baseURL: "http://10.0.2.2:5000/api",
});

// Add a request interceptor to add the auth token to requests
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    // console.log(token);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      AsyncStorage.removeItem('token');
      // router.replace('/startup/onboarding');
    }
    return Promise.reject(error);
  }
);

export default api; 