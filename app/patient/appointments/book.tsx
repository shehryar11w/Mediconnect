import { ThemedText } from '@/components/ThemedText';
import { appointmentService } from '@/services/appointmentService';
import { notificationService } from '@/services/notificationService';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useColorScheme } from '../../../hooks/useColorScheme';
import { createGlobalStyles } from '../../theme/styles';

type Doctor = {
  DoctorId: number;
  DoctorName: string;
  DoctorSpecialization: string;
  DoctorBaseRate: number; // Base consultation rate in dollars
  DoctorAppointments?: {
    [date: string]: {
      slots: string[];
    };
  };
  DoctorWorkingHours: [{
    start: string;
    end: string;
  }];
  DoctorWorkingDays: string[];
  DoctorUnavailableDays: string[];
};

const BookAppointmentScreen = () => {
  const { colors } = useColorScheme();
  const globalStyles = createGlobalStyles(colors);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date(0));
  const [reason, setReason] = useState('');
  const [selectedDuration, setSelectedDuration] = useState(30); // Default 30 minutes
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    const fetchDoctors = async () => {
      try{
        const res = await appointmentService.getDoctors();
        setDoctors(res.data);
        console.log('res', doctors[0].DoctorAppointments);
        // console.log('doctors', res.data);
      } catch (error) {
        console.log('error', error);
      }
    };
    fetchDoctors();
  }, []);

  // Generate available time slots for a given date
  const generateAvailableSlots = (date: Date) => {
    if (!selectedDoctor) return [];

    // Format date as YYYY-MM-DD in local timezone
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    
    // Check if the date is in unavailable dates
    if (selectedDoctor.DoctorUnavailableDays.includes(dateStr)) {
      return [];
    }

    // Check if the day is a working day
    if (!selectedDoctor.DoctorWorkingDays.includes(dayName.toLowerCase())) {
      return [];
    }

    const slots: string[] = [];
    
    const [startHour, startMinute] = selectedDoctor.DoctorWorkingHours[0].start.split(':').map(Number);
    const [endHour, endMinute] = selectedDoctor.DoctorWorkingHours[0].end.split(':').map(Number);

    // Convert end time to minutes for easier calculation
    const endTimeInMinutes = endHour * 60 + endMinute;
    const startTimeInMinutes = startHour * 60 + startMinute;

    // Generate slots based on selected duration
    for (let timeInMinutes = startTimeInMinutes; timeInMinutes < endTimeInMinutes; timeInMinutes += selectedDuration) {
      const hour = Math.floor(timeInMinutes / 60);
      const minute = timeInMinutes % 60;
      
      // Skip if this slot would exceed end time
      if (timeInMinutes + selectedDuration > endTimeInMinutes) {
        break;
      }

      slots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
    }

    return slots;
  };

  const filterOverlappingSlots = (bookedSlots: string[], allSlots: string[], duration: number) => {
    const parseTime = (timeStr: string) => {
      const [h, m] = timeStr.split(":").map(Number);
      return h * 60 + m;
    };
  
    // Convert bookedSlots to array of [startMin, endMin]
    const bookedRanges = bookedSlots.map(slot => {
      const [startStr, endStr] = slot.split("-");
      return [parseTime(startStr), parseTime(endStr)];
    });
  
    return allSlots.filter(slot => {
      const start = parseTime(slot);
      const end = start + duration;
  
      // Check if this slot overlaps with any booked slot
      const overlaps = bookedRanges.some(([bStart, bEnd]) => {
        return start < bEnd && end > bStart;
      });
  
      return !overlaps; // keep it only if it doesn't overlap
    });
  }
  
  // Get available slots for a specific date
  const getAvailableSlots = (date: Date) => {
    if (!selectedDoctor) return [];
    
    // Format date as YYYY-MM-DD in local timezone
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    const bookedSlots = selectedDoctor.DoctorAppointments?.[dateStr]?.slots || [];
    const allSlots = generateAvailableSlots(date);
    // Filter out booked slots
    return filterOverlappingSlots(bookedSlots, allSlots, selectedDuration);
  };

  const handleDayPress = (day: any) => {
    const newDate = new Date(day.dateString);
    setSelectedDate(newDate);
    // Reset selected time when date changes
    setSelectedTime(newDate);
  };

  // Convert doctor's availability to calendar marked dates
  const getMarkedDates = () => {
    if (!selectedDoctor) return {};

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const twoMonthsLater = new Date(today);
    twoMonthsLater.setMonth(twoMonthsLater.getMonth() + 2);

    const markedDates: any = {};
    let currentDate = new Date(today);
    currentDate.setDate(currentDate.getDate() + 1);
    currentDate.setHours(0, 0, 0, 0);

    while (currentDate <= twoMonthsLater) {
      // Format date as YYYY-MM-DD in local timezone
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const day = String(currentDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      // Get day name in local timezone
      const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

      const isWorkingDay = selectedDoctor.DoctorWorkingDays.some(
        day => day.toLowerCase() === dayName
      );

      // Direct string comparison for unavailable dates
      const isUnavailable = selectedDoctor.DoctorUnavailableDays.includes(dateStr);

      const availableSlots = getAvailableSlots(currentDate);
      
      // Format selected date the same way
      const selectedYear = selectedDate.getFullYear();
      const selectedMonth = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const selectedDay = String(selectedDate.getDate()).padStart(2, '0');
      const selectedDateStr = `${selectedYear}-${selectedMonth}-${selectedDay}`;
      const isSelected = selectedDateStr === dateStr;

     

      if (isWorkingDay && !isUnavailable && availableSlots.length > 0) {
        markedDates[dateStr] = {
          marked: true,
          dotColor: colors.patientPrimary,
          selected: isSelected,
          selectedColor: colors.patientPrimary,
          selectedTextColor: colors.background,
        };
      } else if (isSelected) {
        // Always show selected state even if no slots available
        markedDates[dateStr] = {
          selected: true,
          selectedColor: colors.patientPrimary,
          selectedTextColor: colors.background,
        };
      }

      currentDate.setDate(currentDate.getDate() + 1);
      currentDate.setHours(0, 0, 0, 0);
    }

    return markedDates;
  };

  const renderDoctorItem = (doctor: Doctor) => (
    <TouchableOpacity
      key={doctor.DoctorId}
      style={[
        styles.doctorCard,
        {
          backgroundColor: colors.background,
          borderColor: selectedDoctor?.DoctorId === doctor.DoctorId ? colors.patientPrimary : 'transparent',
        },
      ]}
      onPress={() => setSelectedDoctor(doctor)}
    >
      <View style={styles.doctorInfo}>
        <View style={[styles.avatar, { backgroundColor: colors.patientPrimary + '20' }]}>
          <ThemedText style={[styles.avatarText, { color: colors.patientPrimary }]}>
            {doctor.DoctorName.charAt(0)}
          </ThemedText>
        </View>
        <View style={styles.doctorDetails}>
          <ThemedText style={styles.doctorName}>{doctor.DoctorName}</ThemedText>
          <ThemedText style={[styles.specialization, { color: colors.textLight }]}>
            {doctor.DoctorSpecialization}
          </ThemedText>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderTimeSlots = () => {
    if (!selectedDoctor) return null;

    const slots = getAvailableSlots(selectedDate);
    const dateStr = selectedDate.toISOString().split('T')[0];
    const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });

    if (selectedDoctor.DoctorUnavailableDays.includes(dateStr)) {
      return (
        <View style={[styles.timeSlotsContainer, { backgroundColor: colors.background }]}>
          <ThemedText style={[styles.timeSlotsTitle, { color: colors.textLight }]}>
            Doctor is unavailable on this date
          </ThemedText>
        </View>
      );
    }

    if (!selectedDoctor.DoctorWorkingDays.includes(dayName.toLowerCase())) {
      return (
        <View style={[styles.timeSlotsContainer, { backgroundColor: colors.background }]}>
          <ThemedText style={[styles.timeSlotsTitle, { color: colors.textLight }]}>
            No appointments available on {dayName}s
          </ThemedText>
        </View>
      );
    }

    if (slots.length === 0) {
      return (
        <View style={[styles.timeSlotsContainer, { backgroundColor: colors.background }]}>
          <ThemedText style={[styles.timeSlotsTitle, { color: colors.textLight }]}>
            No available slots for this date
          </ThemedText>
        </View>
      );
    }

    return (
      <View style={[styles.timeSlotsContainer, { backgroundColor: colors.background }]}>
        <View style={styles.timeSlotsHeader}>
          <ThemedText style={styles.timeSlotsTitle}>Available Time Slots</ThemedText>
          <View style={styles.durationSelector}>
            <ThemedText style={styles.durationLabel}>Duration:</ThemedText>
            <View style={styles.durationButtons}>
              {[15, 30, 45, 60].map((duration) => (
                <TouchableOpacity
                  key={duration}
                  style={[
                    styles.durationButton,
                    {
                      backgroundColor: selectedDuration === duration ? colors.patientPrimary : colors.patientPrimary + '20',
                    },
                  ]}
                  onPress={() => {
                    setSelectedDuration(duration);
                    setSelectedTime(new Date(0)); // Reset time to epoch
                  }}
                >
                  <ThemedText
                    style={[
                      styles.durationButtonText,
                      {
                        color: selectedDuration === duration ? colors.background : colors.patientPrimary,
                      },
                    ]}
                  >
                    {duration} min
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
        <View style={[styles.timeSlotsGrid, { backgroundColor: colors.background }]}>
          {slots.map((slot: string, index: number) => {
            const [hours, minutes] = slot.split(':');
            const slotTime = new Date(selectedDate);

            // Ensure we're setting the correct 24-hour time
            const hour24 = parseInt(hours);
            slotTime.setHours(hour24, parseInt(minutes));

            const isSelected = selectedTime.getHours() === hour24 + 5 && 
                             selectedTime.getMinutes() === parseInt(minutes);

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.timeSlot,
                  {
                    backgroundColor: isSelected ? colors.patientPrimary : colors.patientPrimary + '20',
                  },
                ]}
                onPress={() => {
                  slotTime.setHours(parseInt(hours) + 5, parseInt(minutes));
                  console.log('slotTime', slotTime.toISOString());
                  setSelectedTime(slotTime);
                }}
              >
                <ThemedText
                  style={[
                    styles.timeSlotText,
                    {
                      color: isSelected ? colors.background : colors.patientPrimary,
                    },
                  ]}
                >
                  {slot}
                </ThemedText>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  // Calculate appointment cost based on doctor's rate, time slot, and duration
  const calculateAppointmentCost = () => {
    if (!selectedDoctor || !selectedTime) return 0;

    const hour = selectedTime.getHours();
    let cost = selectedDoctor.DoctorBaseRate;

    // Add premium for early morning appointments (before 10 AM)
    if (hour < 10) {
      cost += 2000;
    }
    // Add premium for evening appointments (after 4 PM)
    else if (hour >= 16) {
      cost += 3000;
    }

    // Adjust cost based on duration
    const durationMultiplier = selectedDuration / 30; // Base rate is for 30 minutes
    cost = Math.round(cost * durationMultiplier);

    return cost;
  };

  const handleBookAppointment = async () => {
    if (!selectedDoctor || !reason.trim() || !selectedDate || !selectedTime || !selectedDuration) {
      Alert.alert('Error', 'Please fill all the fields');
      return;

    }
    setIsLoading(true);
    const startDateTime = new Date(selectedTime);
    const endDateTime = new Date(startDateTime);
    endDateTime.setMinutes(endDateTime.getMinutes() + selectedDuration);
    // Handle appointment booking

    const appointment = {
      doctorId: selectedDoctor.DoctorId,
      startDateTime: startDateTime.toISOString(),
      endDateTime: endDateTime.toISOString(),
      reason,
      cost: calculateAppointmentCost(),
    };
    try {   
      const response = await appointmentService.createAppointment(appointment.doctorId, appointment.startDateTime, appointment.endDateTime, appointment.reason, appointment.cost);
      console.log('response', response);
      if (response.success) {
        notificationService.scheduleLocalNotification(
          'Appointment Booked',
          'Your appointment has been booked successfully.',
          { appointmentId: response.data.appointmentId as string, type: 'new_appointment' }
        );
        notificationService.scheduleLocalNotification(
          'Appointment Starting',
          'Your appointment is starting.',
          {
            data: { appointmentId: response.data.appointmentId as string, type: 'appointment_starting' },
            trigger: {
              type: 'date',
              date: new Date(startDateTime),
            }
          }
        );
        
          router.back();
     } else {
      Alert.alert('Error', response.message);
      console.log('response', response);
     }
    } catch (error) {
     console.log('error', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={[globalStyles.container, styles.container, { backgroundColor: colors.background }]}>
      {/* Header with Gradient */}
      <LinearGradient
        colors={[colors.patientPrimary, colors.patientPrimary + 'CC']}
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
            Book Appointment
          </ThemedText>
          <View style={styles.headerRight} />
        </View>
      </LinearGradient>

      {/* Select Doctor */}
      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Select Doctor</ThemedText>
        {doctors.map(renderDoctorItem)}
      </View>

      {/* Calendar */}
      {selectedDoctor && (
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Select Date</ThemedText>
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
                selectedDayBackgroundColor: colors.patientPrimary,
                selectedDayTextColor: colors.background,
                todayTextColor: colors.patientPrimary,
                dayTextColor: colors.text,
                textDisabledColor: colors.textLight,
                dotColor: colors.patientPrimary,
                monthTextColor: colors.text,
                arrowColor: colors.patientPrimary,
              }}
            />
          </View>
          {renderTimeSlots()}
        </View>
      )}

      {/* Reason for Visit */}
      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Reason for Visit</ThemedText>
        <View style={[styles.reasonCard, { backgroundColor: colors.background }]}>
          <TextInput
            style={[styles.reasonInput, { color: colors.text }]}
            placeholder="Describe your symptoms or reason for visit..."
            placeholderTextColor={colors.textLight}
            value={reason}
            onChangeText={setReason}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>
      </View>

      {/* Cost Summary */}
      {selectedDoctor && selectedTime.getTime() !== 0 && reason.trim() && selectedDate && selectedDuration && (
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Cost Summary</ThemedText>
          <View style={[styles.costCard, { backgroundColor: colors.background }]}>
            <View style={styles.costRow}>
              <ThemedText style={styles.costLabel}>Base Consultation (30 min)</ThemedText>
              <ThemedText style={styles.costValue}>PKR {selectedDoctor.DoctorBaseRate}</ThemedText>
            </View>
            {selectedDuration !== 30 && (
              <View style={styles.costRow}>
                <ThemedText style={styles.costLabel}>Duration Adjustment ({selectedDuration} min)</ThemedText>
                <ThemedText style={styles.costValue}>
                  {selectedDuration > 30 ? '+' : '-'} PKR {Math.abs(Math.round(selectedDoctor.DoctorBaseRate * (selectedDuration / 30 - 1)))}
                </ThemedText>
              </View>
            )}
            {selectedTime.getHours() < 10 && (
              <View style={styles.costRow}>
                <ThemedText style={styles.costLabel}>Early Morning Premium</ThemedText>
                <ThemedText style={styles.costValue}>+ PKR 2000</ThemedText>
              </View>
            )}
            {selectedTime.getHours() >= 16 && (
              <View style={styles.costRow}>
                <ThemedText style={styles.costLabel}>Evening Premium</ThemedText>
                <ThemedText style={styles.costValue}>+ PKR 3000</ThemedText>
              </View>
            )}
            <View style={[styles.costRow, styles.totalRow]}>
              <ThemedText style={[styles.costLabel, styles.totalLabel]}>Total Cost</ThemedText>
              <ThemedText style={[styles.costValue, styles.totalValue]}>
                PKR {calculateAppointmentCost()}
              </ThemedText>
            </View>
          </View>
        </View>
      )}

      {/* Book Button */}
      <TouchableOpacity
        style={[
          styles.bookButton,
          {
            backgroundColor: selectedDoctor && reason.trim() && selectedTime.getTime() !== 0 && selectedDuration !== 0 ? colors.patientPrimary : colors.textLight,
          },
        ]}
        onPress={handleBookAppointment}
        disabled={!selectedDoctor || !reason.trim() || selectedTime.getTime() === 0 || isLoading || selectedDuration === 0}
      >
        <ThemedText style={[styles.bookButtonText, { color: colors.background }]}>
          {isLoading ? 'Booking...' : 'Book Appointment'}
        </ThemedText>
        {selectedDoctor && selectedTime.getTime() !== 0 && reason.trim() && (
          <ThemedText style={[styles.bookButtonSubtext, { color: colors.background }]}>
            Total: PKR {calculateAppointmentCost()}
          </ThemedText>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

export default BookAppointmentScreen;

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
  headerRight: {
    width: 40,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  doctorCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  doctorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '600',
  },
  doctorDetails: {
    flex: 1,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '600',
  },
  specialization: {
    fontSize: 14,
    marginTop: 2,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
  },
  experience: {
    fontSize: 14,
  },
  unavailableBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  unavailableText: {
    fontSize: 12,
    fontWeight: '600',
  },
  calendarContainer: {
    padding: 16,
    borderRadius: 16,
    shadowColor: '#ff000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  timeSlotsContainer: {
    marginTop: 20,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  timeSlotsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  timeSlotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeSlot: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  timeSlotText: {
    fontSize: 14,
    fontWeight: '600',
  },
  reasonCard: {
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
  reasonInput: {
    fontSize: 16,
    minHeight: 100,
    padding: 0,
  },
  bookButton: {
    margin: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  bookButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  costCard: {
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
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  costLabel: {
    fontSize: 16,
    color: '#666',
  },
  costValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  totalRow: {
    borderBottomWidth: 0,
    marginTop: 8,
    paddingTop: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4CAF50',
  },
  bookButtonSubtext: {
    fontSize: 14,
    marginTop: 4,
  },
  timeSlotsHeader: {
    marginBottom: 16,
  },
  durationSelector: {
    marginTop: 12,
  },
  durationLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  durationButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  durationButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  durationButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
}); 