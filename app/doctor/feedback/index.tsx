import { ThemedText } from '@/components/ThemedText';
import { useAuth } from '@/context/authContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
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
  patientAvatar?: string;
  rating: number;
  comment: string;
  date: string;
  appointmentDate: string;
  appointmentTime: string;
};

const DoctorFeedbackScreen = () => {
  const { colors } = useColorScheme();
  const { currentUser } = useAuth();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await feedbackService.getAllDoctorReviews(currentUser.id);
      console.log('response', response.data.reviews);
      if (response.success) {
        const formattedFeedbacks = response.data.reviews.map((feedback: any) => ({
          id: feedback.feedbackId.toString(),
          patientName: feedback.patientName,
          rating: feedback.rating,
          comment: feedback.comment,
          date: new Date(feedback.appointmentDate).toLocaleDateString(),
          appointmentDate: new Date(feedback.appointmentDate).toLocaleDateString(),
          appointmentTime: new Date(feedback.appointmentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }));
        setFeedbacks(formattedFeedbacks);
      }
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch feedbacks');
      Alert.alert('Error', 'Failed to fetch feedbacks');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate overall rating
  const overallRating = feedbacks.length > 0 
    ? feedbacks.reduce((acc, feedback) => acc + feedback.rating, 0) / feedbacks.length 
    : 0;

  const renderFeedbackItem = (feedback: Feedback) => (
    <TouchableOpacity
      key={feedback.id}
      style={[styles.feedbackCard, { backgroundColor: colors.background }]}
      onPress={() => router.push(`/doctor/feedback/${feedback.id}` as any)}
    >
      <View style={styles.feedbackHeader}>
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
                  size={16}
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

      <ThemedText style={styles.comment} numberOfLines={2}>
        {feedback.comment}
      </ThemedText>

      <View style={styles.appointmentInfo}>
        <View style={styles.infoItem}>
          <Ionicons name="calendar" size={16} color={colors.doctorPrimary} />
          <ThemedText style={[styles.infoText, { color: colors.textLight }]}>
            {feedback.appointmentDate} at {feedback.appointmentTime}
          </ThemedText>
        </View>
      </View>
    </TouchableOpacity>
  );

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
            Patient Feedback
          </ThemedText>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {/* Overall Rating Card */}
        <View style={[styles.overallRatingCard, { backgroundColor: colors.background }]}>
          <ThemedText style={styles.overallRatingTitle}>Overall Rating</ThemedText>
          <View style={styles.overallRatingValue}>
            <ThemedText style={[styles.ratingNumber, { color: colors.doctorPrimary }]}>
              {overallRating.toFixed(1)}
            </ThemedText>
            <View style={styles.ratingStars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                  key={star}
                  name={star <= Math.round(overallRating) ? 'star' : 'star-outline'}
                  size={24}
                  color="#FFD700"
                />
              ))}
            </View>
          </View>
          <ThemedText style={[styles.totalReviews, { color: colors.textLight }]}>
            Based on {feedbacks.length} reviews
          </ThemedText>
        </View>

        {/* Feedback List */}
        <View style={styles.feedbackList}>
          {isLoading ? (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
              <ActivityIndicator size="large" color={colors.doctorPrimary} />
              <ThemedText style={[styles.loadingText, { color: colors.textLight }]}>
                Loading feedback...
              </ThemedText>
            </View>
          ) : error ? (
            <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
              <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
              <ThemedText style={[styles.errorText, { color: colors.error }]}>
                {error}
              </ThemedText>
              <TouchableOpacity
                style={[styles.retryButton, { backgroundColor: colors.doctorPrimary }]}
                onPress={fetchFeedbacks}
              >
                <ThemedText style={[styles.retryButtonText, { color: colors.background }]}>
                  Retry
                </ThemedText>
              </TouchableOpacity>
            </View>
          ) : feedbacks.length > 0 ? (
            feedbacks.map(renderFeedbackItem)
          ) : (
            <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
              <Ionicons name="chatbubble-outline" size={48} color={colors.textLight} />
              <ThemedText style={[styles.emptyText, { color: colors.textLight }]}>
                No feedback yet
              </ThemedText>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

export default DoctorFeedbackScreen;

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
  overallRatingCard: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  overallRatingTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  overallRatingValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ratingNumber: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  ratingStars: {
    flexDirection: 'row',
    gap: 4,
  },
  totalReviews: {
    fontSize: 14,
    marginTop: 8,
  },
  feedbackList: {
    gap: 16,
  },
  feedbackCard: {
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
  feedbackHeader: {
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
  ratingContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  date: {
    fontSize: 14,
  },
  comment: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  appointmentInfo: {
    gap: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
  },
  loadingContainer: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  errorContainer: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
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
  emptyContainer: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    textAlign: 'center',
  },
});
