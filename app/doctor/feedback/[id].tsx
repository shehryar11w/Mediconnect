import { ThemedText } from '@/components/ThemedText';
import { useAuth } from '@/context/authContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useColorScheme } from '../../../hooks/useColorScheme';
import { feedbackService } from '../../../services/feedbackService';

type Feedback = {
  id: string;
  patientName: string;
  rating: number;
  comment: string;
  date: string;
  appointmentDate: string;
  appointmentTime: string;
};

const FeedbackDetailScreen = () => {
  const { colors } = useColorScheme();
  const { id } = useLocalSearchParams();
  const { currentUser } = useAuth();
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFeedbackDetails();
  }, [id]);

  const fetchFeedbackDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await feedbackService.getFeedbackDetails(id);
      console.log('response', response.data);
      if (response.success) {
        const feedbackData = response.data;

        if (feedbackData) {
          const formattedFeedback: Feedback = {
            id: feedbackData.id,
            patientName: feedbackData.patientName,
            rating: feedbackData.rating,
            comment: feedbackData.comment,
            date: new Date(feedbackData.appointmentDate).toLocaleDateString(),
            appointmentDate: new Date(feedbackData.appointmentDate).toLocaleDateString(),
            appointmentTime: new Date(feedbackData.appointmentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
          setFeedback(formattedFeedback);
        } else {
          setError('Feedback not found');
        }
      }
    } catch (error) {
      console.error('Error fetching feedback details:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch feedback details');
      Alert.alert('Error', 'Failed to fetch feedback details');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
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
              Feedback Details
            </ThemedText>
            <View style={styles.placeholder} />
          </View>
        </LinearGradient>

        <View style={[styles.content, { flex: 1, justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color={colors.doctorPrimary} />
          <ThemedText style={[styles.loadingText, { color: colors.textLight, marginTop: 12 }]}>
            Loading feedback details...
          </ThemedText>
        </View>
      </View>
    );
  }

  if (error || !feedback) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
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
              Feedback Details
            </ThemedText>
            <View style={styles.placeholder} />
          </View>
        </LinearGradient>

        <View style={[styles.content, { flex: 1, justifyContent: 'center', alignItems: 'center' }]}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
          <ThemedText style={[styles.errorText, { color: colors.error, marginTop: 12 }]}>
            {error || 'Feedback not found'}
          </ThemedText>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.doctorPrimary, marginTop: 16 }]}
            onPress={fetchFeedbackDetails}
          >
            <ThemedText style={[styles.retryButtonText, { color: colors.background }]}>
              Retry
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
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
            Feedback Details
          </ThemedText>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {/* Patient Info Card */}
        <View style={[styles.card, { backgroundColor: colors.background }]}>
          <View style={styles.patientInfo}>
            <View style={[styles.avatar, { backgroundColor: colors.doctorPrimary + '20' }]}>
              <ThemedText style={[styles.avatarText, { color: colors.doctorPrimary }]}>
                {feedback.patientName.charAt(0)}
              </ThemedText>
            </View>
            <View>
              <ThemedText style={styles.patientName}>{feedback.patientName}</ThemedText>
              <View style={styles.ratingContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons
                    key={star}
                    name={star <= feedback.rating ? 'star' : 'star-outline'}
                    size={20}
                    color="#FFD700"
                  />
                ))}
              </View>
            </View>
          </View>
          <ThemedText style={[styles.date, { color: colors.textLight }]}>
            {feedback.date}
          </ThemedText>
        </View>

        {/* Appointment Details */}
        <View style={[styles.card, { backgroundColor: colors.background }]}>
          <ThemedText style={styles.sectionTitle}>Appointment Details</ThemedText>
          <View style={styles.detailsList}>
            <View style={styles.detailItem}>
              <Ionicons name="calendar" size={20} color={colors.doctorPrimary} />
              <ThemedText style={styles.detailText}>
                {feedback.appointmentDate} at {feedback.appointmentTime}
              </ThemedText>
            </View>
            {feedback.comment && (
              <View style={styles.detailItem}>
                <Ionicons name="medical" size={20} color={colors.doctorPrimary} />
                <ThemedText style={styles.detailText}>
                  Comment: {feedback.comment}
                </ThemedText>
              </View>
            )}
            
            {feedback.date && (
              <View style={styles.detailItem}>
                <Ionicons name="medkit" size={20} color={colors.doctorPrimary} />
                <ThemedText style={styles.detailText}>
                  Date: {feedback.date}
                </ThemedText>
              </View>
            )}
            {feedback.appointmentDate && (
              <View style={styles.detailItem}>
                <Ionicons name="calendar" size={20} color={colors.doctorPrimary} />
                <ThemedText style={styles.detailText}>
                  Appointment Date: {feedback.appointmentDate}
                </ThemedText>
              </View>
            )}
          </View>
        </View>

        {/* Feedback Comment */}
        <View style={[styles.card, { backgroundColor: colors.background }]}>
          <ThemedText style={styles.sectionTitle}>Patient Feedback</ThemedText>
          <ThemedText style={styles.comment}>{feedback.comment}</ThemedText>
        </View>
      </View>
    </ScrollView>
  );
};

export default FeedbackDetailScreen;

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
  card: {
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
  patientInfo: {
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
  patientName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  date: {
    fontSize: 14,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  detailsList: {
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailText: {
    fontSize: 14,
    flex: 1,
  },
  comment: {
    fontSize: 14,
    lineHeight: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});