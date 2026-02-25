import { ThemedText } from '@/components/ThemedText';
import { useAuth } from '@/context/authContext';
import { prescriptionService } from '@/services/prescriptionService';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useColorScheme } from '../../hooks/useColorScheme';
import { createGlobalStyles } from '../theme/styles';

type Prescription = {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate?: string;
  notes?: string;
};

const PrescriptionsScreen = () => {
  const { colors } = useColorScheme();
  const globalStyles = createGlobalStyles(colors);
  const [selectedTab, setSelectedTab] = useState<'active' | 'completed'>('active');
  const [isLoading, setIsLoading] = useState(true);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const { currentUser } = useAuth();
  const fetchPrescriptions = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await prescriptionService.PatientGetAllPrescriptions(parseInt(currentUser.id));
      console.log(response.data);
      if (response.success) {
        const formattedPrescriptions = response.data.map((prescription: any) => {
          const startDate = new Date(prescription.PrescriptionDate);
          const endDate = new Date(startDate.getTime() + prescription.PrescriptionDuration * 24 * 60 * 60 * 1000);

          return {
            id: prescription.PrescriptionId.toString(),
            name: prescription.PrescriptionMedicine,
            dosage: prescription.PrescriptionDosage,
            frequency: prescription.PrescriptionFrequency,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
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
  }, []);

  useEffect(() => {
    fetchPrescriptions();
  }, [fetchPrescriptions]);

  const isPrescriptionActive = (prescription: Prescription) => {
    const now = new Date();
    const endDate = new Date(prescription.endDate || '');
    console.log("endDate",endDate);
    console.log("now",now);
    return endDate > now;
  };
  function formatDate(date: string) {
    return new Date(date).toLocaleDateString();
  }

  const activePrescriptions = prescriptions.filter(isPrescriptionActive);
  const completedPrescriptions = prescriptions.filter(p => !isPrescriptionActive(p));

  const renderPrescription = (prescription: Prescription) => (
    <View key={prescription.id} style={[styles.prescriptionCard, { backgroundColor: colors.background }]}>
      <View style={styles.prescriptionHeader}>
        <View style={styles.medicationInfo}>
          <ThemedText style={styles.medicationName}>{prescription.name}</ThemedText>
          <ThemedText style={[styles.medicationDetails, { color: colors.textLight }]}>
            {prescription.dosage} • {prescription.frequency}
          </ThemedText>
        </View>
      </View>

      <View style={styles.prescriptionDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar" size={20} color={colors.patientPrimary} />
          <ThemedText style={[styles.detailText, { color: colors.textLight }]}>
            Started: {formatDate(prescription.startDate)}
            {prescription.endDate && ` • Ends: ${formatDate(prescription.endDate)}`}
          </ThemedText>
        </View>
        {prescription.notes && (
          <View style={styles.detailRow}>
            <Ionicons name="information-circle" size={20} color={colors.patientPrimary} />
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
    <ScrollView style={[globalStyles.container, styles.container]}>
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
            Prescriptions
          </ThemedText>
        </View>
      </LinearGradient>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === 'active' && { borderBottomColor: colors.patientPrimary }
          ]}
          onPress={() => setSelectedTab('active')}
        >
          <ThemedText
            style={[
              styles.tabText,
              selectedTab === 'active' && { color: colors.patientPrimary }
            ]}
          >
            Active
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === 'completed' && { borderBottomColor: colors.patientPrimary }
          ]}
          onPress={() => setSelectedTab('completed')}
        >
          <ThemedText
            style={[
              styles.tabText,
              selectedTab === 'completed' && { color: colors.patientPrimary }
            ]}
          >
            Completed
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* Prescriptions List */}
      <View style={styles.content}>
        {(selectedTab === 'active' ? activePrescriptions : completedPrescriptions).map(renderPrescription)}
      </View>
    </ScrollView>
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
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 100,
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  content: {
    padding: 16,
    gap: 16,
  },
  prescriptionCard: {
    borderRadius: 20,
    padding: 16,
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
    marginBottom: 16,
  },
  medicationInfo: {
    flex: 1,
  },
  medicationName: {
    fontSize: 18,
    fontWeight: '600',
  },
  medicationDetails: {
    fontSize: 14,
    marginTop: 4,
  },
  prescriptionDetails: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    flex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 