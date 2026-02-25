import { useFonts } from 'expo-font';
import * as Notifications from 'expo-notifications';
import { router, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { AuthProvider, useAuth } from '../context/authContext';
import { ThemeProvider } from '../hooks/useColorScheme';
import { notificationService, NotificationService } from '../services/notificationService';

// Keep the splash screen visible while fonts are loading
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'SpaceMono-Regular': require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
      setAppIsReady(true);
    }
  }, [fontsLoaded]);

  if (!appIsReady) return null;

  return (
    <ThemeProvider>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </ThemeProvider>
  );
}

function RootLayoutNav() {
  const { currentUser } = useAuth();
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    if (currentUser) {
      notificationListener.current = notificationService.addNotificationReceivedListener((notification) => {
        console.log('Received notification:', notification);
      });

      responseListener.current = notificationService.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;
        const userRole = currentUser?.role;
        const notificationData = NotificationService.getNotificationData(String(data.type), data);

        if (userRole === 'doctor') {
          switch (notificationData.type) {
            case 'new_appointment':
            case 'rescheduled_appointment':
            case 'cancelled_appointment':
              router.push(`/doctor/calendar`);
              break;
            case 'appointment_starting':
              router.push(`/doctor/dashboard`);
              break;
          }
        } else {
          switch (notificationData.type) {
            case 'new_appointment':
            case 'rescheduled_appointment':
            case 'cancelled_appointment':
              router.push(`/patient/appointments`);
              break;
            case 'appointment_starting':
              router.push(`/patient/dashboard`);
              break;
            case 'completed_appointment':
              router.push(`/patient/feedback`);
              break;
          }
        }
      });
    }

    return () => {
      if (notificationListener.current) {
        notificationService.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        notificationService.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [currentUser]);

  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        {/* Startup screens */}
        <Stack.Screen name="splashscreen" />
        <Stack.Screen name="startup/onboarding" />
        <Stack.Screen name="startup/signin" />
        <Stack.Screen name="startup/signup" />
        <Stack.Screen name="startup/forgotPassword/index" />
        <Stack.Screen name="startup/forgotPassword/verify" />
        <Stack.Screen name="startup/forgotPassword/reset" />
        <Stack.Screen name="(tabs)" />

        {/* Doctor Screens */}
        <Stack.Screen name="doctor/dashboard" />
        <Stack.Screen name="doctor/profile/profile" />
        <Stack.Screen name="doctor/profile/edit" />
        <Stack.Screen name="doctor/notifications" />
        <Stack.Screen name="doctor/chat/index" />
        <Stack.Screen name="doctor/chat/[id]" />
        <Stack.Screen name="doctor/calendar/index" />
        <Stack.Screen name="doctor/patient/[id]/reports" />
        <Stack.Screen name="doctor/patient/[id]/notes" />
        <Stack.Screen name="doctor/patient/[id]/prescriptions" />
        <Stack.Screen name="doctor/analytics/index" />

        {/* Patient Screens */}
        <Stack.Screen name="patient/dashboard" />
        <Stack.Screen name="patient/profile/profile" />
        <Stack.Screen name="patient/profile/edit" />
        <Stack.Screen name="patient/appointments/index" />
        <Stack.Screen name="patient/appointments/book" />
        <Stack.Screen name="patient/feedback" />
        <Stack.Screen name="patient/receipts/index" />
        <Stack.Screen name="patient/receipts/[id]/index" />
        <Stack.Screen name="patient/chat/index" />
      </Stack>
    </View>
  );
}
