import { ThemedText } from "@/components/ThemedText";
import { useAuth } from "@/context/authContext";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useColorScheme } from "../../hooks/useColorScheme";
import { feedbackService } from "../../services/feedbackService";
import { createGlobalStyles } from "../../theme/styles";

type Appointment = {
    id: string;
    doctorName: string;
    date: string;
    time: string;
    specialty: string;
    rating?: number;
    feedback?: string;
    hasFeedback?: boolean;
};

const FeedbackScreen = () => {
    const { colors } = useColorScheme();
    const globalStyles = createGlobalStyles(colors);
    const { currentUser } = useAuth();

    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [selectedAppointment, setSelectedAppointment] =
        useState<Appointment | null>(null);
    const [rating, setRating] = useState(0);
    const [feedback, setFeedback] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchAppointments();
    }, []);

    const fetchAppointments = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await feedbackService.getPatientAppointments(
                currentUser.id,
            );
            console.log("response", response);
            if (response.success) {
                const formattedAppointments = response.data.map(
                    (appointment: any) => ({
                        id: appointment.appointmentId.toString(),
                        doctorName: appointment.doctorName,
                        date: new Date(appointment.date).toLocaleDateString(),
                        time: new Date(appointment.date).toLocaleTimeString(
                            [],
                            { hour: "2-digit", minute: "2-digit" },
                        ),
                        specialty: appointment.doctorSpecialization,
                        rating: appointment.rating,
                        hasFeedback: appointment.hasFeedback,
                    }),
                );
                setAppointments(formattedAppointments);
            }
        } catch (error) {
            console.error("Error fetching appointments:", error);
            setError(
                error instanceof Error
                    ? error.message
                    : "Failed to fetch appointments",
            );
            Alert.alert("Error", "Failed to fetch appointments");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!selectedAppointment) return;

        try {
            setIsSubmitting(true);
            const response = await feedbackService.submitPatientFeedback({
                appointmentId: selectedAppointment.id,
                rating: rating,
                comment: feedback,
            });

            if (response.success) {
                // Update local state with the new feedback
                const updatedAppointments = appointments.map((apt) =>
                    apt.id === selectedAppointment.id
                        ? { ...apt, rating, feedback }
                        : apt,
                );
                setAppointments(updatedAppointments);
                setSelectedAppointment(null);
                setRating(0);
                setFeedback("");
                Alert.alert("Success", "Thank you for your feedback!");
            }
        } catch (error) {
            console.error("Error submitting feedback:", error);
            Alert.alert(
                "Error",
                "Failed to submit feedback. Please try again.",
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderStar = (index: number) => (
        <TouchableOpacity
            key={index}
            onPress={() => setRating(index + 1)}
            style={styles.starButton}
        >
            <Ionicons
                name={index < rating ? "star" : "star-outline"}
                size={32}
                color={
                    index < rating ? colors.patientPrimary : colors.textLight
                }
            />
        </TouchableOpacity>
    );

    return (
        <View style={[globalStyles.container, styles.container]}>
            {/* Header with Gradient */}
            <LinearGradient
                colors={[colors.patientPrimary, colors.patientPrimary + "CC"]}
                style={styles.headerGradient}
            >
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <Ionicons
                            name="arrow-back"
                            size={24}
                            color={colors.background}
                        />
                    </TouchableOpacity>
                    <ThemedText
                        style={[
                            styles.headerTitle,
                            { color: colors.background },
                        ]}
                    >
                        Appointment Feedback
                    </ThemedText>
                    <View style={{ width: 40 }} />
                </View>
            </LinearGradient>

            <ScrollView style={styles.content}>
                {/* Appointments List */}
                <View style={styles.section}>
                    <ThemedText style={styles.sectionTitle}>
                        Previous Appointments
                    </ThemedText>
                    {isLoading ? (
                        <View
                            style={[
                                styles.loadingContainer,
                                { backgroundColor: colors.background },
                            ]}
                        >
                            <ActivityIndicator
                                size="large"
                                color={colors.patientPrimary}
                            />
                            <ThemedText
                                style={[
                                    styles.loadingText,
                                    { color: colors.textLight },
                                ]}
                            >
                                Loading appointments...
                            </ThemedText>
                        </View>
                    ) : error ? (
                        <View
                            style={[
                                styles.errorContainer,
                                { backgroundColor: colors.background },
                            ]}
                        >
                            <Ionicons
                                name="alert-circle-outline"
                                size={48}
                                color={colors.error}
                            />
                            <ThemedText
                                style={[
                                    styles.errorText,
                                    { color: colors.error },
                                ]}
                            >
                                {error}
                            </ThemedText>
                            <TouchableOpacity
                                style={[
                                    styles.retryButton,
                                    { backgroundColor: colors.patientPrimary },
                                ]}
                                onPress={fetchAppointments}
                            >
                                <ThemedText
                                    style={[
                                        styles.retryButtonText,
                                        { color: colors.background },
                                    ]}
                                >
                                    Retry
                                </ThemedText>
                            </TouchableOpacity>
                        </View>
                    ) : appointments.length > 0 ? (
                        appointments.map((appointment) => (
                            <TouchableOpacity
                                key={appointment.id}
                                disabled={appointment.hasFeedback}
                                style={[
                                    styles.appointmentCard,
                                    { backgroundColor: colors.background },
                                    selectedAppointment?.id ===
                                        appointment.id && styles.selectedCard,
                                ]}
                                onPress={() => {
                                    setSelectedAppointment(appointment);
                                    setRating(appointment.rating || 0);
                                    setFeedback(appointment.feedback || "");
                                }}
                            >
                                <View style={styles.appointmentInfo}>
                                    <ThemedText style={styles.doctorName}>
                                        {appointment.doctorName}
                                    </ThemedText>
                                    <ThemedText
                                        style={[
                                            styles.specialty,
                                            { color: colors.textLight },
                                        ]}
                                    >
                                        {appointment.specialty}
                                    </ThemedText>
                                    <ThemedText
                                        style={[
                                            styles.dateTime,
                                            { color: colors.textLight },
                                        ]}
                                    >
                                        {appointment.date} at {appointment.time}
                                    </ThemedText>
                                </View>
                                {appointment.hasFeedback && (
                                    <View style={styles.ratingContainer}>
                                        {[0, 1, 2, 3, 4].map((index) => (
                                            <Ionicons
                                                key={index}
                                                name={
                                                    index < appointment.rating!
                                                        ? "star"
                                                        : "star-outline"
                                                }
                                                size={16}
                                                color={
                                                    index < appointment.rating!
                                                        ? colors.patientPrimary
                                                        : colors.textLight
                                                }
                                            />
                                        ))}
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))
                    ) : (
                        <View
                            style={[
                                styles.emptyContainer,
                                { backgroundColor: colors.background },
                            ]}
                        >
                            <Ionicons
                                name="calendar-outline"
                                size={48}
                                color={colors.textLight}
                            />
                            <ThemedText
                                style={[
                                    styles.emptyText,
                                    { color: colors.textLight },
                                ]}
                            >
                                No appointments found
                            </ThemedText>
                        </View>
                    )}
                </View>

                {/* Feedback Form */}
                {selectedAppointment && (
                    <View
                        style={[
                            styles.card,
                            { backgroundColor: colors.background },
                        ]}
                    >
                        <View style={styles.section}>
                            <ThemedText style={styles.sectionTitle}>
                                Rate your experience
                            </ThemedText>
                            <View style={styles.starsContainer}>
                                {[0, 1, 2, 3, 4].map(renderStar)}
                            </View>
                            <ThemedText
                                style={[
                                    styles.ratingText,
                                    { color: colors.textLight },
                                ]}
                            >
                                {rating === 0
                                    ? "Tap to rate"
                                    : rating === 1
                                      ? "Poor"
                                      : rating === 2
                                        ? "Fair"
                                        : rating === 3
                                          ? "Good"
                                          : rating === 4
                                            ? "Very Good"
                                            : "Excellent"}
                            </ThemedText>
                        </View>

                        <View style={styles.section}>
                            <ThemedText style={styles.sectionTitle}>
                                Your Feedback
                            </ThemedText>
                            <TextInput
                                style={[
                                    styles.feedbackInput,
                                    {
                                        color: colors.text,
                                        borderColor: colors.border,
                                        backgroundColor: colors.background,
                                    },
                                ]}
                                placeholder="Share your experience with us..."
                                placeholderTextColor={colors.textLight}
                                multiline
                                numberOfLines={6}
                                textAlignVertical="top"
                                value={feedback}
                                onChangeText={setFeedback}
                            />
                        </View>

                        <TouchableOpacity
                            style={[
                                styles.submitButton,
                                {
                                    backgroundColor:
                                        rating > 0
                                            ? colors.patientPrimary
                                            : colors.textLight,
                                    opacity: rating > 0 ? 1 : 0.5,
                                },
                            ]}
                            onPress={handleSubmit}
                            disabled={rating === 0 || isSubmitting}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator color={colors.background} />
                            ) : (
                                <ThemedText
                                    style={[
                                        styles.submitButtonText,
                                        { color: colors.background },
                                    ]}
                                >
                                    Submit Feedback
                                </ThemedText>
                            )}
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

export default FeedbackScreen;

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
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: "bold",
    },
    content: {
        flex: 1,
        padding: 16,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "600",
        marginBottom: 16,
    },
    appointmentCard: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    selectedCard: {
        borderWidth: 2,
        borderColor: "#4CAF50",
    },
    appointmentInfo: {
        flex: 1,
    },
    doctorName: {
        fontSize: 16,
        fontWeight: "600",
        marginBottom: 4,
    },
    specialty: {
        fontSize: 14,
        marginBottom: 4,
    },
    dateTime: {
        fontSize: 14,
    },
    ratingContainer: {
        flexDirection: "row",
        gap: 4,
        marginTop: 8,
    },
    card: {
        borderRadius: 20,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    starsContainer: {
        flexDirection: "row",
        justifyContent: "center",
        gap: 8,
        marginBottom: 8,
    },
    starButton: {
        padding: 4,
    },
    ratingText: {
        textAlign: "center",
        fontSize: 16,
        marginTop: 8,
    },
    feedbackInput: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        minHeight: 120,
    },
    submitButton: {
        padding: 16,
        borderRadius: 12,
        alignItems: "center",
        marginTop: 8,
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: "600",
    },
    loadingContainer: {
        padding: 20,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
    },
    errorContainer: {
        padding: 20,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    errorText: {
        marginTop: 12,
        fontSize: 16,
        textAlign: "center",
    },
    retryButton: {
        marginTop: 16,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 20,
    },
    retryButtonText: {
        fontSize: 16,
        fontWeight: "600",
    },
    emptyContainer: {
        padding: 20,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    emptyText: {
        marginTop: 12,
        fontSize: 16,
        textAlign: "center",
    },
});
