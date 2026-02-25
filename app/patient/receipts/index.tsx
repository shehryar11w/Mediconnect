import { ThemedText } from '@/components/ThemedText';
import { useAuth } from '@/context/authContext';
import { appointmentService } from '@/services/appointmentService';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useColorScheme } from '../../../hooks/useColorScheme';
import { createGlobalStyles } from '../../theme/styles';

type Receipt = {
  id: string;
  appointmentId: string;
  doctorName: string;
  specialty: string;
  date: string;
  time: string;
  baseRate: number;
  timePremium: number;
  totalAmount: number;
  invoiceNumber: string;
  status: string;
};

const ReceiptsScreen = () => {
  const { colors } = useColorScheme();
  const globalStyles = createGlobalStyles(colors);
  const [isLoading, setIsLoading] = useState(true);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const { currentUser } = useAuth();

  const fetchReceipts = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await appointmentService.getPatientAppointments(parseInt(currentUser.id));
      console.log(response.data[0]);
      if (response.success) {
        const formattedReceipts = response.data.map((receipt: any) => ({
          appointmentId: receipt.AppointmentId.toString(),
          doctorName: receipt.doctorName,
          specialty: receipt.doctorSpecialization,
          date: receipt.AppointmentStartDateTime,
          time: receipt.AppointmentStartDateTime,
          totalAmount: receipt.AppointmentCost,
          status: receipt.AppointmentStatus,
        }));
        const filteredReceipts = formattedReceipts.filter((receipt: any) => receipt.status === 'pending' || receipt.status === 'completed');
        setReceipts(filteredReceipts);
      } else {
        Alert.alert('Error', 'Failed to fetch receipts');
      }
    } catch (error) {
      console.error('Error fetching receipts:', error);
      Alert.alert('Error', 'Failed to fetch receipts');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser.id]);

  useEffect(() => {
    fetchReceipts();
  }, [fetchReceipts]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <View style={[globalStyles.container, styles.container, styles.loadingContainer]}>
        <ThemedText>Loading receipts...</ThemedText>
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
            Payment Receipts
          </ThemedText>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      {/* Receipts List */}
      {receipts.length > 0 && (
      <View style={styles.section}>
        {receipts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <ThemedText style={styles.emptyText}>No receipts found</ThemedText>
          </View>
        ) : (
          receipts.map((receipt) => 
            <TouchableOpacity
              key={receipt.appointmentId}
              style={[
                styles.receiptCard,
                { backgroundColor: colors.background },
              ]}
              onPress={() => router.push({
                pathname: '/patient/receipts/[id]',
                params: { id: receipt.appointmentId }
              })}
            >
              <View style={styles.receiptCardHeader}>
                <ThemedText style={styles.receiptDate}>{formatDate(receipt.date)}</ThemedText>
              </View>
              <View style={styles.receiptCardContent}>
                <ThemedText style={styles.doctorName}>{receipt.doctorName}</ThemedText>
                <ThemedText style={styles.specialty}>{receipt.specialty}</ThemedText>
                <ThemedText style={styles.amount}>PKR {receipt.totalAmount.toLocaleString()}</ThemedText>
              </View>
            </TouchableOpacity>
          )
          )}
        </View>
      )}
    </ScrollView>
  );
};

export default ReceiptsScreen;

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
  section: {
    padding: 20,
  },
  receiptCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  receiptCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  receiptDate: {
    fontSize: 14,
    color: '#666',
  },
  receiptCardContent: {
    gap: 4,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '600',
  },
  specialty: {
    fontSize: 14,
    color: '#666',
  },
  amount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4CAF50',
    marginTop: 4,
  },
  receiptDetails: {
    padding: 20,
    borderRadius: 16,
    margin: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  receiptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  invoiceNumber: {
    fontSize: 16,
    fontWeight: '600',
  },
  doctorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  doctorAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  doctorInitial: {
    fontSize: 24,
    fontWeight: '600',
  },
  doctorDetails: {
    flex: 1,
  },
  appointmentInfo: {
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  costBreakdown: {
    marginBottom: 20,
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
    fontSize: 14,
    color: '#666',
  },
  costValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  totalRow: {
    borderBottomWidth: 0,
    marginTop: 8,
    paddingTop: 16,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4CAF50',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  downloadButtonText: {
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
}); 