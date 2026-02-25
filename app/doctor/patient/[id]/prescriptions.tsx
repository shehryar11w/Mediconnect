import { createGlobalStyles } from '@/app/theme/styles';
import { ThemedText } from '@/components/ThemedText';
import { useColorScheme } from '@/hooks/useColorScheme';
import { prescriptionService } from '@/services/prescriptionService';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

type Prescription = {
  id: string;
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  startDate: string;
  endDate: string;
  notes?: string;
};

type ValidationErrors = {
  medication?: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  notes?: string;
};

const PrescriptionsScreen = () => {
  const { colors } = useColorScheme();
  const globalStyles = createGlobalStyles(colors);
  const { id } = useLocalSearchParams<{ id: string }>();
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [backendError, setBackendError] = useState<string | null>(null);
  const [newPrescription, setNewPrescription] = useState({
    medication: '',
    dosage: '',
    frequency: '',
    duration: '',
    notes: '',
  });

  const fetchPrescriptions = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await prescriptionService.DoctorGetAllPrescriptions(parseInt(id));
      console.log(response.data);
      if (response.success) {
        const formattedPrescriptions = response.data.map((prescription: any) => {
          const startDate = new Date(prescription.PrescriptionDate);
          const durationDays = parseInt(prescription.PrescriptionDuration);
          const endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + durationDays);
          
          return {
            id: prescription.PrescriptionId.toString(),
            medication: prescription.PrescriptionMedicine,
            dosage: prescription.PrescriptionDosage,
            frequency: prescription.PrescriptionFrequency,
            duration: prescription.PrescriptionDuration,
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0],
            notes: prescription.PrescriptionNotes,
          };
        });
        setPrescriptions(formattedPrescriptions);
      } else {
        Alert.alert('Error', 'Failed to fetch prescriptions');
      }
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      Alert.alert('Error', 'Failed to fetch prescriptions');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPrescriptions();
  }, [fetchPrescriptions]);

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};
    let isValid = true;

    if (!newPrescription.medication.trim()) {
      errors.medication = 'Medication name is required';
      isValid = false;
    }

    if (!newPrescription.dosage.trim()) {
      errors.dosage = 'Dosage is required';
      isValid = false;
    }

    if (!newPrescription.frequency.trim()) {
      errors.frequency = 'Frequency is required';
      isValid = false;
    }

    if (!newPrescription.duration.trim()) {
      errors.duration = 'Duration is required';
      isValid = false;
    }

    setValidationErrors(errors);
    return isValid;
  };

  const handleAddPrescription = async () => {
    setBackendError(null);
    setValidationErrors({});

    if (!validateForm()) {
      return;
    }

    try {
      const prescriptionData = {
        medication: newPrescription.medication.trim(),
        dosage: newPrescription.dosage.trim(),
        frequency: newPrescription.frequency.trim(),
        duration: newPrescription.duration.trim(),
        notes: newPrescription.notes.trim(),
      };

      console.log(prescriptionData);

      const response = await prescriptionService.addPrescription(
        parseInt(id),
        prescriptionData.medication,
        prescriptionData.dosage,
        prescriptionData.frequency,
        prescriptionData.duration,
        prescriptionData.notes
      );

      if (response.success) {
        Alert.alert('Success', 'Prescription added successfully');
        setIsAdding(false);
        setNewPrescription({
          medication: '',
          dosage: '',
          frequency: '',
          duration: '',
          notes: '',
        });
        fetchPrescriptions();
      } else {
        setBackendError(response.message || 'Failed to add prescription');
      }
    } catch (error: any) {
      console.error('Error adding prescription:', error);
      setBackendError(error.message || 'Failed to add prescription');
    }
  };

  const renderInputField = (
    label: string,
    field: keyof ValidationErrors,
    placeholder: string,
    multiline: boolean = false
  ) => (
    <View style={styles.inputGroup}>
      <ThemedText style={[styles.inputLabel, { color: colors.textLight }]}>
        {label}
      </ThemedText>
      <TextInput
        style={[
          styles.input,
          { 
            color: colors.text, 
            borderColor: validationErrors[field] ? colors.error : colors.textLight,
          },
          multiline && styles.textArea,
        ]}
        value={newPrescription[field]}
        onChangeText={(text) => {
          setNewPrescription({ ...newPrescription, [field]: text });
          if (validationErrors[field]) {
            setValidationErrors({ ...validationErrors, [field]: undefined });
          }
        }}
        placeholder={placeholder}
        placeholderTextColor={colors.textLight}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
      />
      {validationErrors[field] && (
        <ThemedText style={[styles.errorText, { color: colors.error }]}>
          {validationErrors[field]}
        </ThemedText>
      )}
    </View>
  );

  const renderPrescriptionCard = (prescription: Prescription) => (
    <View
      key={prescription.id}
      style={[styles.prescriptionCard, { backgroundColor: colors.background }]}
    >
      <View style={styles.prescriptionHeader}>
        <View style={styles.medicationInfo}>
          <ThemedText style={styles.medicationName}>
            {prescription.medication}
          </ThemedText>
          <ThemedText style={[styles.medicationDosage, { color: colors.textLight }]}>
            {prescription.dosage}
          </ThemedText>
        </View>
      </View>

      <View style={styles.prescriptionDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="time" size={16} color={colors.textLight} />
          <ThemedText style={[styles.detailText, { color: colors.textLight }]}>
            {prescription.frequency}
          </ThemedText>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="calendar" size={16} color={colors.textLight} />
          <ThemedText style={[styles.detailText, { color: colors.textLight }]}>
            Duration: {prescription.duration}
          </ThemedText>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={16} color={colors.textLight} />
          <ThemedText style={[styles.detailText, { color: colors.textLight }]}>
            {prescription.startDate} - {prescription.endDate}
          </ThemedText>
        </View>
        {prescription.notes && (
          <View style={styles.detailRow}>
            <Ionicons name="document-text" size={16} color={colors.textLight} />
            <ThemedText style={[styles.detailText, { color: colors.textLight }]}>
              {prescription.notes}
            </ThemedText>
          </View>
        )}
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={[globalStyles.container, styles.container, styles.loadingContainer]}>
        <ThemedText>Loading prescriptions...</ThemedText>
      </View>
    );
  }

  return (
    <View style={[globalStyles.container, styles.container]}>
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
            Prescriptions
          </ThemedText>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setIsAdding(true)}
          >
            <Ionicons name="add" size={24} color={colors.background} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {isAdding ? (
          <View style={[styles.addCard, { backgroundColor: colors.background }]}>
            <ThemedText style={styles.addTitle}>New Prescription</ThemedText>
            
            {backendError && (
              <View style={[styles.errorBox, { backgroundColor: colors.error + '20' }]}>
                <ThemedText style={[styles.errorBoxText, { color: colors.error }]}>
                  {backendError}
                </ThemedText>
              </View>
            )}

            {renderInputField('Medication', 'medication', 'Enter medication name')}
            {renderInputField('Dosage', 'dosage', 'Enter dosage')}
            {renderInputField('Frequency', 'frequency', 'Enter frequency')}
            {renderInputField('Duration', 'duration', 'Enter duration')}
            {renderInputField('Notes', 'notes', 'Enter any additional notes', true)}

            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setIsAdding(false);
                  setValidationErrors({});
                  setBackendError(null);
                }}
              >
                <ThemedText style={[styles.buttonText, { color: colors.text }]}>
                  Cancel
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.saveButton, { backgroundColor: colors.doctorPrimary }]}
                onPress={handleAddPrescription}
              >
                <ThemedText style={[styles.buttonText, { color: colors.background }]}>
                  Save
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            {prescriptions.length === 0 ? (
              <View style={styles.emptyContainer}>
                <ThemedText style={styles.emptyText}>No prescriptions found</ThemedText>
              </View>
            ) : (
              prescriptions.map(renderPrescriptionCard)
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
};

export default PrescriptionsScreen;

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
  addButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  prescriptionCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  prescriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  medicationInfo: {
    flex: 1,
  },
  medicationName: {
    fontSize: 18,
    fontWeight: '600',
  },
  medicationDosage: {
    fontSize: 14,
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  prescriptionDetails: {
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    paddingTop: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    marginLeft: 8,
    fontSize: 14,
  },
  addCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#E5E5E5',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  errorBox: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorBoxText: {
    fontSize: 14,
  },
}); 