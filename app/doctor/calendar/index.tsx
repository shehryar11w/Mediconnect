import { ThemedText } from '@/components/ThemedText';
import { useAuth } from '@/context/authContext';
import { appointmentService } from '@/services/appointmentService';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useColorScheme } from '../../../hooks/useColorScheme';

type Appointment = {
  AppointmentId: string;
  patientName: string;
  patientAvatar?: string;
  AppointmentStartDateTime: string;
  AppointmentEndDateTime: string;
  AppointmentStatus: 'pending' | 'completed' | 'cancelled';
};

const DoctorCalendarScreen = () => {
  const { colors } = useColorScheme();
  const { currentUser } = useAuth();
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAppointments = async () => {
    try {
      const response = await appointmentService.getAppointments(currentUser?.id);
      if (response.success) {
        setAppointments(response.data);
      } else {
        Alert.alert('Error', 'Failed to fetch appointments');
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      Alert.alert('Error', 'Failed to fetch appointments');
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [currentUser?.id]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAppointments();
    setRefreshing(false);
  }, []);

  const handleCancelAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowCancelModal(true);
  };

  const confirmCancellation = async () => {
    if (!selectedAppointment) return;
    
    try {
      const response = await appointmentService.cancelDoctorAppointment(selectedAppointment.AppointmentId);
      if (response.success) {
        Alert.alert(
          'Appointment Cancelled',
          'The appointment has been cancelled successfully.',
          [
            {
              text: 'OK',
              onPress: () => {
                setShowCancelModal(false);
                setSelectedAppointment(null);
                fetchAppointments(); // Refresh the appointments list
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to cancel appointment');
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      Alert.alert('Error', 'Failed to cancel appointment');
    }
  };

  const handleDayPress = (day: any) => {
    const newDate = new Date(day.dateString);
    setSelectedDate(newDate);
  };

  // Convert appointments to calendar marked dates
  const getMarkedDates = () => {
    const markedDates: any = {};



    // Mark dates with appointments
    appointments.forEach(appointment => {
      const appointmentDate = new Date(appointment.AppointmentStartDateTime).toISOString().split('T')[0];
      if (markedDates[appointmentDate]) {
        // If date already marked, just add another dot
        markedDates[appointmentDate].dots = [
          ...(markedDates[appointmentDate].dots || []),
          { color: colors.doctorPrimary }
        ];
      } else {
        markedDates[appointmentDate] = {
          marked: true,
          dotColor: colors.doctorPrimary,
          selected: selectedDate.toISOString().split('T')[0] === appointmentDate,
          selectedColor: colors.doctorPrimary,
          selectedTextColor: colors.background,
        };
      }
    });

    // Only return dates that have appointments or are today
    const filteredMarkedDates: any = {};
    Object.keys(markedDates).forEach(date => {
      if (appointments.some(app => 
        new Date(app.AppointmentStartDateTime).toISOString().split('T')[0] === date
      )) {
        filteredMarkedDates[date] = markedDates[date];
      }
    });
    console.log(filteredMarkedDates);
    return filteredMarkedDates;
  };

  const formatTime = (dateTime: string) => {
    const date = new Date(dateTime);
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
  };

  const renderAppointmentCard = (appointment: Appointment) => (
    <View
      key={appointment.AppointmentId}
      style={[styles.appointmentCard, { backgroundColor: colors.background }]}
    >
      <View style={styles.appointmentHeader}>
        <View style={styles.patientInfo}>
          <View style={[styles.avatar, { backgroundColor: colors.doctorPrimary + '20' }]}>
            <ThemedText style={[styles.avatarText, { color: colors.doctorPrimary }]}>
              {appointment.patientName.charAt(0)}
            </ThemedText>
          </View>
          <View>
            <ThemedText style={styles.patientName}>{appointment.patientName}</ThemedText>
            <View style={styles.appointmentType}>
              <ThemedText style={[styles.typeText, { color: colors.textLight }]}>
                {appointment.AppointmentStatus}
              </ThemedText>
            </View>
          </View>
        </View>
        <View style={styles.timeContainer}>
          <ThemedText style={[styles.time, { color: colors.doctorPrimary }]}>
            {formatTime(appointment.AppointmentStartDateTime)}
          </ThemedText>
        </View>
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.doctorPrimary + '20' }]}
          onPress={() => router.push(`/doctor/patient/${appointment.AppointmentId}/notes`)}
        >
          <Ionicons name="document-text" size={20} color={colors.doctorPrimary} />
          <ThemedText style={[styles.actionText, { color: colors.doctorPrimary }]}>
            Notes
          </ThemedText>
        </TouchableOpacity>

        
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#FF5252' + '20' }]}
            onPress={() => handleCancelAppointment(appointment)}
          >
            <Ionicons name="close-circle" size={20} color="#FF5252" />
            <ThemedText style={[styles.actionText, { color: '#FF5252' }]}>
              Cancel
            </ThemedText>
          </TouchableOpacity>
        
      </View>
    </View>
  );

  // Filter appointments for selected date
  const filteredAppointments = appointments.filter(
    appointment => new Date(appointment.AppointmentStartDateTime).toISOString().split('T')[0] === selectedDate.toISOString().split('T')[0]
  );

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[colors.doctorPrimary]}
          tintColor={colors.doctorPrimary}
          progressBackgroundColor={colors.background}
        />
      }
    >
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
            Calendar
          </ThemedText>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {/* Calendar */}
        <View style={[styles.calendarContainer, { backgroundColor: colors.background }]}>
          <Calendar
            onDayPress={handleDayPress}
            markedDates={getMarkedDates()}
            minDate={new Date().toISOString().split('T')[0]}
            maxDate={(() => {
              const date = new Date();
              date.setMonth(date.getMonth() + 2);
              return date.toISOString().split('T')[0];
            })()}
            firstDay={0}
            theme={{
              backgroundColor: colors.background,
              calendarBackground: colors.background,
              textSectionTitleColor: colors.text,
              selectedDayBackgroundColor: colors.doctorPrimary,
              selectedDayTextColor: colors.background,
              todayTextColor: colors.doctorPrimary,
              dayTextColor: colors.text,
              textDisabledColor: colors.textLight,
              dotColor: colors.doctorPrimary,
              monthTextColor: colors.text,
              arrowColor: colors.doctorPrimary,
            }}
          />
        </View>

        {/* Date Header */}
        <View style={[styles.dateHeader, { backgroundColor: colors.background }]}>
          <ThemedText style={styles.dateText}>
            {selectedDate.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </ThemedText>
        </View>

        {/* Appointments List */}
        <View style={styles.appointmentsList}>
          {filteredAppointments.length > 0 ? (
            filteredAppointments.map(renderAppointmentCard)
          ) : (
            <View style={[styles.noAppointments, { backgroundColor: colors.background }]}>
              <Ionicons name="calendar" size={48} color={colors.textLight} />
              <ThemedText style={[styles.noAppointmentsText, { color: colors.textLight }]}>
                No appointments scheduled for this date
              </ThemedText>
            </View>
          )}
        </View>
      </View>

      {/* Cancel Confirmation Modal */}
      <Modal
        visible={showCancelModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCancelModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <ThemedText style={styles.modalTitle}>Cancel Appointment</ThemedText>
            <ThemedText style={[styles.modalText, { color: colors.textLight }]}>
              Are you sure you want to cancel the appointment with{' '}
              {selectedAppointment?.patientName} on{' '}
              {new Date(selectedAppointment?.AppointmentStartDateTime || '').toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}?
            </ThemedText>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.doctorPrimary + '20' }]}
                onPress={() => setShowCancelModal(false)}
              >
                <ThemedText style={[styles.modalButtonText, { color: colors.doctorPrimary }]}>
                  Keep Appointment
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#FF5252' + '20' }]}
                onPress={confirmCancellation}
              >
                <ThemedText style={[styles.modalButtonText, { color: '#FF5252' }]}>
                  Cancel Appointment
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

export default DoctorCalendarScreen;

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
  placeholder: {
    width: 40,
  },
  content: {
    padding: 20,
    gap: 20,
  },
  calendarContainer: {
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dateHeader: {
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dateText: {
    fontSize: 18,
    fontWeight: '600',
  },
  appointmentsList: {
    gap: 16,
  },
  appointmentCard: {
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  patientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  appointmentType: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  typeText: {
    fontSize: 14,
  },
  timeContainer: {
    padding: 8,
    borderRadius: 8,
  },
  time: {
    fontSize: 16,
    fontWeight: '600',
  },
  symptomsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  symptoms: {
    fontSize: 14,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    padding: 24,
    borderRadius: 16,
    gap: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalText: {
    fontSize: 16,
    lineHeight: 24,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  noAppointments: {
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  noAppointmentsText: {
    fontSize: 16,
    textAlign: 'center',
  },
}); 