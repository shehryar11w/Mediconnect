import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../services/authService';
const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const checkLogin = async () => {
    const token = await AsyncStorage.getItem('token');
    const storedUser = await AsyncStorage.getItem('user');
    console.log(token,storedUser);
    if (token && storedUser) {
      // Set the user immediately from storage
      try{
        setCurrentUser(JSON.parse(storedUser));
      }catch(error){
        console.error('Error parsing user:', error);
        console.log(storedUser);
        AsyncStorage.removeItem('token');
        AsyncStorage.removeItem('user');
        setCurrentUser(null);
      }
      
      // Validate token with backend
      const validateToken = async () => {
        try {
          const response = await authService.validateToken(token);
          console.log(response);
          if (!response.valid) {
            throw new Error('Token validation failed');
          }

          setCurrentUser(response.user);
          if(response.user.role === "doctor"){
            router.replace('/doctor/dashboard');
          }else{
            router.replace('/patient/dashboard');
          }
        } catch (error) {
          console.error('Token validation error:', error);
          AsyncStorage.removeItem('token');
          AsyncStorage.removeItem('user');
          setCurrentUser(null);
        }
      };
      validateToken();
    }
    setLoading(false);
  }
    checkLogin();
  }, []);

  async function signup(email, password, name,role,phone,specialization) {
    try {
      let response;
      if(role === "doctor"){
        response = await authService.doctorRegister(email, password, name,phone,specialization);
      }else{
        response = await authService.patientRegister(email, password, name,phone);
      }
      console.log(response);
      if(response.error){
        console.log("error");
        throw new Error(response.error);
      }
      AsyncStorage.setItem('token', response.token);
      AsyncStorage.setItem('user', JSON.stringify(response.user));
      setCurrentUser(response.user);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async function login(email, password,role) {
    try {
      let response;
      if(role === "doctor"){
        response = await authService.doctorLogin(email, password);
      }else{
        response = await authService.patientLogin(email, password);
      }
      if(response.error){
        throw new Error(response.error);
      }
      AsyncStorage.setItem('token', response.token);
      AsyncStorage.setItem('user', JSON.stringify(response.user));
      setCurrentUser(response.user);
      return response;
    } catch (error) {
      throw error;
    }
  }

  function logout() {
    AsyncStorage.removeItem('token');
    AsyncStorage.removeItem('user');
    setCurrentUser(null);
  }

  const value = {
    currentUser,
    signup,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
} 