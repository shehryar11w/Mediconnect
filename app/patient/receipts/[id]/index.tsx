import { createGlobalStyles } from '@/app/theme/styles';
import { ThemedText } from '@/components/ThemedText';
import { useColorScheme } from '@/hooks/useColorScheme';
import { appointmentService } from '@/services/appointmentService';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';

type Receipt = {
  appointmentId: string;
  doctorName: string;
  specialty: string;
  date: string;
  time: string;
  baseRate: number;
  timePremium: number;
  totalAmount: number;
  invoiceNumber: string;
};

const adjustTime = (time: string) => {
  const [hours, minutes] = time.split(':');
  const adjustedHours = parseInt(hours) + 5;
  return `${adjustedHours}:${minutes}`;
};


const ReceiptDetailsScreen = () => {
  const { colors } = useColorScheme();
  const globalStyles = createGlobalStyles(colors);
  const { id } = useLocalSearchParams();
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReceipt = async () => {
      try {
        const response = await appointmentService.getReceipt(id);
        console.log(response);
        if (response.success) {
          setReceipt({
            appointmentId: response.data[0].appointmentId.toString(),
            doctorName: response.data[0].doctorName,
            specialty: response.data[0].specialty,
            date: response.data[0].date,
            time: adjustTime(response.data[0].time),
            baseRate: response.data[0].baseRate,
            timePremium: 0,
            totalAmount: response.data[0].totalAmount,
            invoiceNumber: response.data[0].invoiceNumber
          });
        } else {
          setError('Failed to fetch receipt');
        }
      } catch (error) {
        console.error('Error fetching receipt:', error);
        setError('Failed to fetch receipt');
      } finally {
        setIsLoading(false);
      }
    };
    fetchReceipt();
  }, [id]);

  if (isLoading) {
    return (
      <View style={[globalStyles.container, styles.container]}>
        <ThemedText>Loading receipt...</ThemedText>
      </View>
    );
  }

  if (!receipt) {
    return (
      <View style={[globalStyles.container, styles.container]}>
        <ThemedText>Receipt not found</ThemedText>
      </View>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

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
            Receipt Details
          </ThemedText>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      {/* Receipt Details */}
      <View style={styles.section}>
        <View style={[styles.receiptDetails, { backgroundColor: colors.background }]}>
          <View style={styles.receiptHeader}>
            <ThemedText style={styles.invoiceNumber}>Invoice #{receipt.invoiceNumber}</ThemedText>
          </View>

          <View style={styles.doctorInfo}>
              <View style={[styles.doctorAvatar, { backgroundColor: colors.patientPrimary + '20' }]}>
                <ThemedText style={[styles.doctorInitial, { color: colors.patientPrimary }]}>
                  {receipt.doctorName.charAt(0)}
                </ThemedText>
              </View>

            <View style={styles.doctorDetails}>
              <ThemedText style={styles.doctorName}>{receipt.doctorName}</ThemedText>
              <ThemedText style={styles.specialty}>{receipt.specialty}</ThemedText>
            </View>
          </View>

          <View style={styles.appointmentInfo}>
            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>Appointment Date</ThemedText>
              <ThemedText style={styles.infoValue}>{formatDate(receipt.date)}</ThemedText>
            </View>
            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>Time</ThemedText>
              <ThemedText style={styles.infoValue}>{receipt.time}</ThemedText>
            </View>
          </View>

          <View style={styles.costBreakdown}>
            <View style={styles.costRow}>
              <ThemedText style={styles.costLabel}>Base Consultation</ThemedText>
              <ThemedText style={styles.costValue}>PKR {receipt.baseRate.toLocaleString()}</ThemedText>
            </View>
            {receipt.timePremium > 0 && (
              <View style={styles.costRow}>
                <ThemedText style={styles.costLabel}>Time Premium</ThemedText>
                <ThemedText style={styles.costValue}>+PKR {receipt.timePremium.toLocaleString()}</ThemedText>
              </View>
            )}
            <View style={[styles.costRow, styles.totalRow]}>
              <ThemedText style={[styles.costLabel, styles.totalLabel]}>Total Amount</ThemedText>
              <ThemedText style={[styles.costValue, styles.totalValue]}>
                PKR {receipt.totalAmount.toLocaleString()}
              </ThemedText>
            </View>
          </View>

          {/* <TouchableOpacity
            style={[styles.downloadButton, { backgroundColor: colors.patientPrimary }]}
            onPress={() => {
              // Handle download receipt
              console.log('Downloading receipt:', receipt.invoiceNumber);
            }}
          >
            <Ionicons name="download-outline" size={20} color={colors.background} />
            <ThemedText style={[styles.downloadButtonText, { color: colors.background }]}>
              Download Receipt
            </ThemedText>
          </TouchableOpacity> */}
        </View>
      </View>
    </ScrollView>
  );
};

export default ReceiptDetailsScreen;

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
  receiptDetails: {
    padding: 20,
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
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
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
  doctorName: {
    fontSize: 16,
    fontWeight: '600',
  },
  specialty: {
    fontSize: 14,
    color: '#666',
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
}); 