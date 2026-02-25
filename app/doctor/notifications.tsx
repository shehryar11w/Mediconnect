import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useColorScheme } from '../../hooks/useColorScheme';
import { createGlobalStyles } from '../theme/styles';

type Notification = {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'appointment' | 'message' | 'report' | 'system';
  read: boolean;
};

const NotificationsScreen = () => {
  const { colors } = useColorScheme();
  const globalStyles = createGlobalStyles(colors);

  // Sample notifications data
  const notifications: Notification[] = [
    {
      id: '1',
      title: 'New Appointment',
      message: 'John Doe has scheduled an appointment for tomorrow at 10:00 AM',
      time: '5 minutes ago',
      type: 'appointment',
      read: false,
    },
    {
      id: '2',
      title: 'New Message',
      message: 'Sarah Miller sent you a message about her test results',
      time: '1 hour ago',
      type: 'message',
      read: false,
    },
    {
      id: '3',
      title: 'Report Ready',
      message: 'Lab test results for Emma Wilson are now available',
      time: '2 hours ago',
      type: 'report',
      read: true,
    },
    {
      id: '4',
      title: 'System Update',
      message: 'The app has been updated to version 2.0.0',
      time: '1 day ago',
      type: 'system',
      read: true,
    },
  ];

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'appointment':
        return 'calendar';
      case 'message':
        return 'chatbubble';
      case 'report':
        return 'document-text';
      case 'system':
        return 'information-circle';
    }
  };

  const renderNotification = (notification: Notification) => (
    <TouchableOpacity
      key={notification.id}
      style={[
        styles.notificationCard,
        { backgroundColor: colors.background },
        !notification.read && styles.unreadCard,
      ]}
    >
      <View style={[styles.iconContainer, { backgroundColor: colors.doctorPrimary + '20' }]}>
        <Ionicons
          name={getNotificationIcon(notification.type)}
          size={24}
          color={colors.doctorPrimary}
        />
      </View>
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <ThemedText style={styles.notificationTitle}>{notification.title}</ThemedText>
          <ThemedText style={[styles.notificationTime, { color: colors.textLight }]}>
            {notification.time}
          </ThemedText>
        </View>
        <ThemedText style={[styles.notificationMessage, { color: colors.textLight }]}>
          {notification.message}
        </ThemedText>
      </View>
      {!notification.read && (
        <View style={[styles.unreadDot, { backgroundColor: colors.doctorPrimary }]} />
      )}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={[globalStyles.container, styles.container]}>
      {/* Header with Gradient */}
      <LinearGradient
        colors={[colors.doctorPrimary, colors.doctorPrimary + 'CC']}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.background} />
          </TouchableOpacity>
          <ThemedText style={[styles.headerTitle, { color: colors.background }]}>
            Notifications
          </ThemedText>
          <TouchableOpacity 
            style={styles.clearButton}
            onPress={() => {
              // Mark all as read
            }}
          >
            <ThemedText style={[styles.clearText, { color: colors.background }]}>
              Clear All
            </ThemedText>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {notifications.map(renderNotification)}
      </View>
    </ScrollView>
  );
};

export default NotificationsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  clearButton: {
    padding: 8,
  },
  clearText: {
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    padding: 16,
    gap: 12,
  },
  notificationCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF0000',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  notificationTime: {
    fontSize: 12,
  },
  notificationMessage: {
    fontSize: 14,
    lineHeight: 20,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
    alignSelf: 'center',
  },
}); 