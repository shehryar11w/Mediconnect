import { ThemedText } from '@/components/ThemedText';
import { useAuth } from '@/context/authContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useColorScheme } from '../../../hooks/useColorScheme';
import { analyticsService } from '../../../services/analyticsService';

type PerformanceMetrics = {
  totalPatients: number;
  averageRating: number;
  totalRevenue: number;
};

type ChartData = {
  labels: string[];
  datasets: {
    data: number[];
  }[];
};

const DoctorAnalyticsScreen = () => {
  const { colors } = useColorScheme();
  const { currentUser } = useAuth();
  const screenWidth = Dimensions.get('window').width - 40; // Accounting for padding

  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [monthlyRevenue, setMonthlyRevenue] = useState<ChartData | null>(null);
  const [patientSatisfaction, setPatientSatisfaction] = useState<ChartData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [analyticsResponse, trendsResponse] = await Promise.all([
        analyticsService.getAnalytics(currentUser.id),
        analyticsService.getTrends(currentUser.id)
      ]);

      if (analyticsResponse.success) {
        setPerformanceMetrics({
          totalPatients: analyticsResponse.data.totalPatients,
          averageRating: analyticsResponse.data.averageRating,
          totalRevenue: analyticsResponse.data.totalRevenue,
        });
      }

      if (trendsResponse.success) {
        console.log(trendsResponse.data);
        setMonthlyRevenue({
          labels: trendsResponse.data.revenue.map((item: any) => item.period.split('-')[0]),
          datasets: [{
            data: trendsResponse.data.revenue.map((item: any) => item.amount),
          }],
        });

        setPatientSatisfaction({
          labels: trendsResponse.data.satisfaction.map((item: any) => item.period.split('-')[0]),
          datasets: [{
            data: trendsResponse.data.satisfaction.map((item: any) => item.rating),
          }],
        });
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch analytics');
      Alert.alert('Error', 'Failed to fetch analytics data');
    } finally {
      setIsLoading(false);
    }
  };

  const chartConfig = {
    backgroundGradientFrom: colors.background,
    backgroundGradientTo: colors.background,
    color: (opacity = 1) => colors.doctorPrimary,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    decimalPlaces: 0,
  };

  const renderMetricCard = (
    title: string,
    value: string | number,
    icon: string,
    color: string,
    suffix?: string
  ) => (
    <View style={[styles.metricCard, { backgroundColor: colors.background }]}>
      <View style={[styles.metricIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon as any} size={24} color={color} />
      </View>
      <View style={styles.metricContent}>
        <ThemedText style={styles.metricTitle}>{title}</ThemedText>
        <ThemedText style={[styles.metricValue, { color }]}>
          {value}{suffix}
        </ThemedText>
      </View>
    </View>
  );

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
              Analytics Dashboard
            </ThemedText>
            <View style={styles.placeholder} />
          </View>
        </LinearGradient>

        <View style={[styles.content, { flex: 1, justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color={colors.doctorPrimary} />
          <ThemedText style={[styles.loadingText, { color: colors.textLight, marginTop: 12 }]}>
            Loading analytics...
          </ThemedText>
        </View>
      </View>
    );
  }

  if (error) {
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
              Analytics Dashboard
            </ThemedText>
            <View style={styles.placeholder} />
          </View>
        </LinearGradient>

        <View style={[styles.content, { flex: 1, justifyContent: 'center', alignItems: 'center' }]}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
          <ThemedText style={[styles.errorText, { color: colors.error, marginTop: 12 }]}>
            {error}
          </ThemedText>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.doctorPrimary, marginTop: 16 }]}
            onPress={fetchAnalytics}
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
            Analytics Dashboard
          </ThemedText>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {/* Key Performance Metrics */}
        {performanceMetrics && (
          <View style={styles.metricsGrid}>
            {renderMetricCard(
              'Total Patients',
              performanceMetrics.totalPatients,
              'people',
              colors.doctorPrimary
            )}
            {renderMetricCard(
              'Average Rating',
              performanceMetrics.averageRating,
              'star',
              '#FFD700'
            )}
            {renderMetricCard(
              'Total Revenue',
              `PKR ${performanceMetrics.totalRevenue.toLocaleString()}`,
              'cash',
              '#4CAF50'
            )}
          </View>
        )}

        {/* Revenue Trends */}
        {monthlyRevenue && (
          <View style={[styles.chartCard, { backgroundColor: colors.background }]}>
            <ThemedText style={styles.chartTitle}>Revenue Trends</ThemedText>
            <LineChart
              data={monthlyRevenue}
              width={screenWidth}
              height={220}
              chartConfig={chartConfig}
              style={styles.chart}
            />
          </View>
        )}

        {/* Patient Satisfaction */}
        {patientSatisfaction && (
          <View style={[styles.chartCard, { backgroundColor: colors.background }]}>
            <ThemedText style={styles.chartTitle}>Patient Satisfaction</ThemedText>
            <LineChart
              data={patientSatisfaction}
              width={screenWidth}
              height={220}
              chartConfig={{
                ...chartConfig,
                color: (opacity = 1) => '#FFD700',
              }}
              style={styles.chart}
            />
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default DoctorAnalyticsScreen;

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
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    maxWidth: '50%',
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
  metricIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricContent: {
    gap: 4,
  },
  metricTitle: {
    fontSize: 14,
    color: '#666',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  chartCard: {
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
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  chart: {
    marginRight: 25,
    marginVertical: 8,
    borderRadius: 16,
  },
  loadingText: {
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
}); 