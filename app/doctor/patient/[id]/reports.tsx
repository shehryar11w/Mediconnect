import { ThemedText } from '@/components/ThemedText';
import { reportService } from '@/services/ReportService';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useColorScheme } from '../../../../hooks/useColorScheme';
import { createGlobalStyles } from '../../../theme/styles';

const REPORT_TYPES = ['lab', 'imaging', 'consultation', 'forms'] as const;
type ReportType = typeof REPORT_TYPES[number];

interface ApiReport {
  ReportId: number;
  ReportTitle: string;
  ReportType: string;
  ReportDate: string;
  ReportFile: string;
}

interface FormattedReport {
  id: string;
  title: string;
  type: string;
  date: string;
  file: string;
}

const ReportsScreen = () => {
  const { colors } = useColorScheme();
  const globalStyles = createGlobalStyles(colors);
  const { id } = useLocalSearchParams();
  const [selectedTab, setSelectedTab] = useState<'all' | ReportType>('all');
  const [isUploadModalVisible, setIsUploadModalVisible] = useState(false);
  const [newReportTitle, setNewReportTitle] = useState('');
  const [newReportType, setNewReportType] = useState<ReportType>('forms');
  const [newReportDescription, setNewReportDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [reports, setReports] = useState<FormattedReport[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReports();
  }, [selectedTab]);

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      const type = selectedTab === 'all' ? null : selectedTab;
      const response = await reportService.DoctorGetReports(id as string);
      if (response.success) {
        const formattedReports = response.data.map((report: ApiReport) => ({
          id: report.ReportId.toString(),
          title: report.ReportTitle,
          type: report.ReportType,
          date: new Date(report.ReportDate).toLocaleDateString(),
          file: report.ReportFile,
        }));
        setReports(formattedReports);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch reports');
      Alert.alert('Error', 'Failed to fetch reports');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf'],
      });

      if (result.assets && result.assets[0]) {
        setSelectedFile(result.assets[0]);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to upload document');
    }
  };

  const handleSubmitReport = async () => {
    if (!newReportTitle.trim()) {
      Alert.alert('Error', 'Please enter a title for the report');
      return;
    }

    if (!selectedFile) {
      Alert.alert('Error', 'Please upload a PDF document');
      return;
    }

    if (!REPORT_TYPES.includes(newReportType)) {
      Alert.alert('Error', 'Invalid report type');
      return;
    }

    setIsUploading(true);
    try {
      const fileToUpload = {
        uri: selectedFile.uri,
        type: 'application/pdf',
        name: selectedFile.name,
      };

      const response = await reportService.addReport(
        fileToUpload,
        newReportType,
        newReportDescription,
        newReportTitle
      );

      if (response.success) {
        await fetchReports();
        setIsUploadModalVisible(false);
        setNewReportTitle('');
        setNewReportType('forms');
        setNewReportDescription('');
        setSelectedFile(null);
        Alert.alert('Success', 'Report uploaded successfully');
      }
    } catch (error) {
      console.error('Error uploading report:', error);
      Alert.alert('Error', 'Failed to upload report');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadReport = async (reportId: string) => {
    try {
      const response = await reportService.downloadReport(parseInt(reportId));
      if (response.success) {
        const url = response.data.url;
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error('Error downloading report:', error);
      Alert.alert('Error', 'Failed to download report');
    }
  };

  const renderReport = (report: FormattedReport) => (
    <View key={report.id} style={[styles.reportCard, { backgroundColor: colors.background }]}>
      <View style={styles.reportHeader}>
        <View style={styles.reportInfo}>
          <ThemedText style={styles.reportTitle}>{report.title}</ThemedText>
          <ThemedText style={[styles.reportDetails, { color: colors.textLight }]}>
            {report.type} • {report.date}
          </ThemedText>
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.attachmentItem, { backgroundColor: colors.doctorPrimary + '10' }]}
        onPress={() => handleDownloadReport(report.id)}
      >
        <Ionicons name="document" size={20} color={colors.doctorPrimary} />
        <View style={styles.attachmentInfo}>
          <ThemedText style={styles.attachmentName}>{report.file}</ThemedText>
          <ThemedText style={[styles.attachmentDetails, { color: colors.textLight }]}>
            PDF • {report.date}
          </ThemedText>
        </View>
        <Ionicons name="download" size={20} color={colors.doctorPrimary} />
      </TouchableOpacity>
    </View>
  );

  const renderUploadModal = () => (
    <View style={[styles.modalContainer, { backgroundColor: colors.background + 'CC'}]}>
      <View style={styles.modalHeader}>
        <ThemedText style={styles.modalTitle}>Upload New Report</ThemedText>
        <TouchableOpacity onPress={() => setIsUploadModalVisible(false)}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.modalContent}>
        <View style={styles.inputGroup}>
          <ThemedText style={styles.inputLabel}>Title</ThemedText>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            placeholder="Enter report title"
            placeholderTextColor={colors.textLight}
            value={newReportTitle}
            onChangeText={setNewReportTitle}
          />
        </View>

        <View style={styles.inputGroup}>
          <ThemedText style={styles.inputLabel}>Type</ThemedText>
          <View style={styles.typeButtons}>
            {REPORT_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.typeButton,
                  { backgroundColor: newReportType === type ? colors.doctorPrimary : colors.doctorPrimary + '20' },
                ]}
                onPress={() => setNewReportType(type)}
              >
                <ThemedText
                  style={[
                    styles.typeButtonText,
                    { color: newReportType === type ? colors.background : colors.doctorPrimary },
                  ]}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <ThemedText style={styles.inputLabel}>Description</ThemedText>
          <TextInput
            style={[styles.input, styles.textArea, { color: colors.text, borderColor: colors.border }]}
            placeholder="Enter report description"
            placeholderTextColor={colors.textLight}
            value={newReportDescription}
            onChangeText={setNewReportDescription}
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.inputGroup}>
          <ThemedText style={styles.inputLabel}>PDF Document</ThemedText>
          <TouchableOpacity
            style={[styles.uploadButton, { backgroundColor: colors.doctorPrimary + '20' }]}
            onPress={handleUploadDocument}
          >
            <Ionicons name="document" size={24} color={colors.doctorPrimary} />
            <ThemedText style={[styles.uploadButtonText, { color: colors.doctorPrimary }]}>
              {selectedFile ? 'Change PDF' : 'Upload PDF'}
            </ThemedText>
          </TouchableOpacity>
          {selectedFile && (
            <View style={[styles.fileNameContainer, { backgroundColor: colors.doctorPrimary + '20' }]}>
            
              <ThemedText style={[styles.fileName, { color: colors.doctorPrimary }]} numberOfLines={1}>
                {selectedFile.name}
              </ThemedText>
            </View>
          )}
        </View> 
        <View style={styles.modalFooter}>
        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: isUploading ? colors.doctorPrimary + '50' : colors.doctorPrimary }]}
          onPress={handleSubmitReport}
          disabled={isUploading}
        >
          <ThemedText style={[styles.submitButtonText, { color: colors.background }]}>
            {isUploading ? 'Uploading...' : 'Upload Report'}
          </ThemedText>
        </TouchableOpacity>
      </View>
      </ScrollView>
    </View>
  );

  return (
    <>
    {isUploadModalVisible ? renderUploadModal() : (
    <ScrollView style={[globalStyles.container, styles.container]}>
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
            Medical Reports
          </ThemedText>
        </View>
      </LinearGradient>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === 'all' && { borderBottomColor: colors.doctorPrimary }
          ]}
          onPress={() => setSelectedTab('all')}
        >
          <ThemedText
            style={[
              styles.tabText,
              selectedTab === 'all' && { color: colors.doctorPrimary }
            ]}
          >
            All
          </ThemedText>
        </TouchableOpacity>
        {REPORT_TYPES.map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.tab,
              selectedTab === type && { borderBottomColor: colors.doctorPrimary }
            ]}
            onPress={() => setSelectedTab(type)}
          >
            <ThemedText
              style={[
                styles.tabText,
                selectedTab === type && { color: colors.doctorPrimary }
              ]}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>

      <View style={[styles.content, { backgroundColor: colors.background }]}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.doctorPrimary} />
          </View>
        ) : (
        reports.length > 0 && !isLoading ? (
          reports.map(renderReport)
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="document-outline" size={48} color={colors.textLight} />
            <ThemedText style={[styles.emptyStateText, { color: colors.textLight }]}>
              No reports found
            </ThemedText>
          </View>
        ))}
      </View>
    </ScrollView>
    )}
    </>
  );
};

export default ReportsScreen;

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
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    width: 40,
    marginRight: 100,
  },
  headerTitle: {
    marginRight: 100,
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerUploadButton: {
    padding: 8,
    width: 40,
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
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  content: {
    padding: 16,
    gap: 16,
  },
  reportCard: {
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
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  reportInfo: {
    flex: 1,
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  reportDetails: {
    fontSize: 14,
    marginTop: 4,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  attachmentInfo: {
    flex: 1,
  },
  attachmentName: {
    fontSize: 14,
    fontWeight: '500',
  },
  attachmentDetails: {
    fontSize: 12,
    marginTop: 2,
  },
  modalContainer: {
    flex: 1,
    marginTop: 100,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
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
  typeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  fileName: {
    fontSize: 14,
    marginTop: 8,
    fontWeight: '500',
    textAlign: 'center',
    width: '100%',
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  submitButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    width: '100%',
    justifyContent: 'center',
    
  },
}); 