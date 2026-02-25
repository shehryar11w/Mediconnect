import { ThemedText } from '@/components/ThemedText';
import { appointmentService } from '@/services/appointmentService';
import { notificationService } from '@/services/notificationService';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useColorScheme } from '../../../hooks/useColorScheme';

type Appointment = {
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
}

const RescheduleScreen = () => {
  const { colors } = useColorScheme();
  const { appointmentId } = useLocalSearchParams();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [selectedDuration, setSelectedDuration] = useState(30); // Default 30 minutes
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  // Sample doctor data with availability


  useEffect(() => {
    const fetchAppointment = async () => {
      const res = await appointmentService.getAppointment(appointmentId);
      setAppointment({
        DoctorBaseRate: res.data.DoctorBaseRate,
        DoctorAppointments: res.data.DoctorBookedSlots,
        DoctorWorkingHours: res.data.DoctorWorkingHours,
        DoctorWorkingDays: res.data.DoctorWorkingDays,
        DoctorUnavailableDays: res.data.DoctorUnavailableDays,
      });
      console.log('res', res);
    }
    fetchAppointment();
  }, [appointmentId]);
  // Generate available time slots for a given date
  const generateAvailableSlots = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    
    // Check if the date is in unavailable dates
    if (appointment?.DoctorUnavailableDays.includes(dateStr)) {
      return [];
    }

    // Check if the day is a working day
    if (!appointment?.DoctorWorkingDays.includes(dayName.toLowerCase())) {
      return [];
    }

    const slots: string[] = [];
    const [startHour, startMinute] = appointment?.DoctorWorkingHours[0].start.split(':').map(Number);
    const [endHour, endMinute] = appointment?.DoctorWorkingHours[0].end.split(':').map(Number);

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
    const dateStr = date.toISOString().split('T')[0];
    const bookedSlots = appointment?.DoctorAppointments?.[dateStr]?.slots || [];
    const allSlots = generateAvailableSlots(date);
    if(bookedSlots.length > 0){
      // console.log('bookedSlots', bookedSlots);
      // console.log('allSlots', allSlots);
      // console.log('FilteredSlots', filterOverlappingSlots(bookedSlots, allSlots, selectedDuration));
    }
    // Filter out booked slots
    return filterOverlappingSlots(bookedSlots, allSlots, selectedDuration);
  };

  const handleDayPress = (day: any) => {
    const [year, month, date] = day.dateString.split('-').map(Number);
    const newDate = new Date(year, month - 1, date+1);
    newDate.setHours(0, 0, 0, 0);
    setSelectedDate(newDate);
    // Reset selected time when date changes
    setSelectedTime(newDate);
  };

  // Convert doctor's availability to calendar marked dates
  const getMarkedDates = () => {
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

      const isWorkingDay = appointment?.DoctorWorkingDays.some(
        day => day.toLowerCase() === dayName
      );
      const isUnavailable = appointment?.DoctorUnavailableDays.includes(dateStr);
      const availableSlots = getAvailableSlots(currentDate);
      
      // Format selected date the same way
      const selectedYear = selectedDate.getFullYear();
      const selectedMonth = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const selectedDay = String(selectedDate.getDate() -1).padStart(2, '0');
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

  const renderTimeSlots = () => {
    const slots = getAvailableSlots(selectedDate);
    const dateStr = selectedDate.toISOString().split('T')[0];
    const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });

    if (appointment?.DoctorUnavailableDays.includes(dateStr)) {
      return (
        <View style={[styles.timeSlotsContainer, { backgroundColor: colors.background }]}>
          <ThemedText style={[styles.timeSlotsTitle, { color: colors.textLight }]}>
            Doctor is unavailable on this date
          </ThemedText>
        </View>
      );
    }

    if (!appointment?.DoctorWorkingDays.includes(dayName.toLowerCase())) {
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
            slotTime.setHours(parseInt(hours), parseInt(minutes));
            
            const isSelected = selectedTime.getHours() === parseInt(hours) && 
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
                onPress={() => setSelectedTime(slotTime)}
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
    const hour = selectedTime.getHours();
    let cost = appointment?.DoctorBaseRate || 0;

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

  const handleReschedule = async () => {
    // Here you would typically make an API call to update the appointment
    const startDateTime = new Date(selectedTime);
    startDateTime.setHours(startDateTime.getHours() + 5, startDateTime.getMinutes(), 0, 0);
    const endDateTime = new Date(startDateTime);
    endDateTime.setHours(endDateTime.getHours(), endDateTime.getMinutes() + selectedDuration, 0, 0);
    const RescheduleAppointment = {
      appointmentId,
      startDateTime: startDateTime.toISOString(),
      endDateTime: endDateTime.toISOString(),
      newCost: calculateAppointmentCost(),
    }
    console.log('Rescheduling appointment:', RescheduleAppointment);

    try {   
      const response = await appointmentService.rescheduleAppointment(RescheduleAppointment.appointmentId, RescheduleAppointment.startDateTime, RescheduleAppointment.endDateTime, RescheduleAppointment.newCost);
      console.log('response', response);
      if (response.success) {
        notificationService.scheduleLocalNotification(
          'Appointment Rescheduled',
          'Your appointment has been rescheduled successfully.',
          { appointmentId: appointmentId as string, type: 'rescheduled_appointment' }
        );
        router.back();
     } else {
      Alert.alert('Error', response.message);
      console.log('response', response);
     }
    } catch (error) {
     console.log('error', error);
    }
    
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
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
            Reschedule Appointment
          </ThemedText>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {/* Calendar */}
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
        </View>

        {/* Time Slots */}
        {renderTimeSlots()}

        {/* Cost Summary */}
        {selectedTime && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Cost Summary</ThemedText>
            <View style={[styles.costCard, { backgroundColor: colors.background }]}>
              <View style={styles.costRow}>
                <ThemedText style={styles.costLabel}>Base Consultation (30 min)</ThemedText>
                <ThemedText style={styles.costValue}>PKR {appointment?.DoctorBaseRate}</ThemedText>
              </View>
              {selectedDuration !== 30 && (
                <View style={styles.costRow}>
                  <ThemedText style={styles.costLabel}>Duration Adjustment ({selectedDuration} min)</ThemedText>
                  <ThemedText style={styles.costValue}>
                    {selectedDuration > 30 ? '+' : '-'} PKR {Math.abs(Math.round(appointment?.DoctorBaseRate || 0 * (selectedDuration / 30 - 1)))}
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
              <View style={[styles.costRow, styles.totalRow, { backgroundColor: colors.background }]}>
                <ThemedText style={[styles.costLabel, styles.totalLabel, { color: colors.text }]}>Total Cost</ThemedText>
                <ThemedText style={[styles.costValue, styles.totalValue, { color: colors.text }]}>
                  PKR {calculateAppointmentCost()}
                </ThemedText>
              </View>
            </View>
          </View>
        )}

        {/* Reschedule Button */}
        <TouchableOpacity
          style={[styles.rescheduleButton, { backgroundColor: colors.patientPrimary }]}
          onPress={handleReschedule}
        >
          <ThemedText style={[styles.rescheduleButtonText, { color: colors.background }]}>
            Confirm Reschedule
          </ThemedText>
          {selectedTime && (
            <ThemedText style={[styles.rescheduleButtonSubtext, { color: colors.background }]}>
              Total: PKR {calculateAppointmentCost()}
            </ThemedText>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default RescheduleScreen;

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
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
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
  timeSlotsContainer: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#fff',
    shadowColor: '#000',
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
  rescheduleButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  rescheduleButtonText: {
    fontSize: 16,
    fontWeight: '600',
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
  rescheduleButtonSubtext: {
    fontSize: 14,
    marginTop: 4,
  },
}); 