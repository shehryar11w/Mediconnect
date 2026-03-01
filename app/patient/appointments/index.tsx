import { ThemedText } from "@/components/ThemedText";
import { useAuth } from "@/context/authContext";
import { notificationService } from "@/services/notificationService";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
    Alert,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import { useColorScheme } from "../../../hooks/useColorScheme";
import { appointmentService } from "../../../services/appointmentService";
import { createGlobalStyles } from "../../../theme/styles";
type Appointment = {
    AppointmentId: string;
    DoctorName: string;
    DoctorSpecialization: string;
    AppointmentDate: string;
    AppointmentTime: string;
    AppointmentStatus: "pending" | "completed" | "cancelled" | "rescheduled";
    AppointmentReason: string;
};

const AppointmentsScreen = () => {
    const { colors } = useColorScheme();
    const globalStyles = createGlobalStyles(colors);
    const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [selectedAppointment, setSelectedAppointment] =
        useState<Appointment | null>(null);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const { currentUser } = useAuth();
    const [refreshing, setRefreshing] = useState(false);
    // Sample appointments data

    const fetchAppointments = async () => {
        const res = await appointmentService.getPatientAppointments(
            currentUser?.id,
        );
        console.log("appointments", res.data);
        setAppointments(
            res.data.map((appointment: any) => ({
                AppointmentId: appointment.AppointmentId,
                DoctorName: appointment.doctorName,
                DoctorSpecialization: appointment.doctorSpecialization,
                AppointmentDate:
                    appointment.AppointmentStartDateTime.split("T")[0],
                AppointmentTime: appointment.AppointmentStartDateTime.split(
                    "T",
                )[1]
                    .split(".")[0]
                    .split(":")
                    .slice(0, 2)
                    .join(":"),
                AppointmentStatus: appointment.AppointmentStatus,
                AppointmentReason: appointment.AppointmentReason,
            })),
        );
    };

    useEffect(() => {
        if (currentUser) {
            fetchAppointments();
        }
    }, [currentUser]);

    const filteredAppointments = appointments.filter((appointment) => {
        if (activeTab === "upcoming") {
            return (
                appointment.AppointmentStatus === "pending" ||
                appointment.AppointmentStatus === "rescheduled"
            );
        } else {
            return (
                appointment.AppointmentStatus === "completed" ||
                appointment.AppointmentStatus === "cancelled"
            );
        }
    });

    const getStatusColor = (status: Appointment["AppointmentStatus"]) => {
        switch (status) {
            case "pending":
                return "#FFA000";
            case "rescheduled":
                return colors.patientPrimary;
            case "completed":
                return "#4CAF50";
            case "cancelled":
                return colors.error;
        }
    };

    const getStatusText = (status: Appointment["AppointmentStatus"]) => {
        switch (status) {
            case "pending":
                return "Pending";
            case "completed":
                return "Completed";
            case "cancelled":
                return "Cancelled";
            case "rescheduled":
                return "Rescheduled";
        }
    };

    const handleCancelAppointment = (appointment: Appointment) => {
        setSelectedAppointment(appointment);
        setShowCancelModal(true);
    };

    const confirmCancelAppointment = async () => {
        if (selectedAppointment) {
            // Here you would typically make an API call to cancel the appointment
            try {
                const res = await appointmentService.cancelPatientAppointment(
                    selectedAppointment.AppointmentId,
                );
                if (res.success) {
                    Alert.alert(
                        "Appointment Cancelled",
                        "Your appointment has been cancelled successfully.",
                        [{ text: "OK" }],
                    );
                    notificationService.scheduleLocalNotification(
                        "Appointment Cancelled",
                        "Your appointment has been cancelled successfully.",
                        {
                            appointmentId:
                                selectedAppointment.AppointmentId as string,
                            type: "cancelled_appointment",
                        },
                    );
                    setShowCancelModal(false);
                    setSelectedAppointment(null);
                }
            } catch (error) {
                console.log("error", error);
            }
        }
    };

    const handleRescheduleAppointment = (appointment: Appointment) => {
        router.push({
            pathname: "/patient/appointments/reschedule",
            params: { appointmentId: appointment.AppointmentId },
        });
    };

    const renderAppointment = ({
        item,
        key,
    }: {
        item: Appointment;
        key: number;
    }) => (
        <View
            style={[
                styles.appointmentCard,
                { backgroundColor: colors.background },
            ]}
            key={key}
        >
            <View style={styles.appointmentHeader}>
                <View style={styles.doctorInfo}>
                    <View
                        style={[
                            styles.avatar,
                            { backgroundColor: colors.patientPrimary + "20" },
                        ]}
                    >
                        <ThemedText
                            style={[
                                styles.avatarText,
                                { color: colors.patientPrimary },
                            ]}
                        >
                            {item.DoctorName.charAt(0)}
                        </ThemedText>
                    </View>
                    <View>
                        <ThemedText style={styles.doctorName}>
                            {item.DoctorName}
                        </ThemedText>
                        <ThemedText
                            style={[
                                styles.specialization,
                                { color: colors.textLight },
                            ]}
                        >
                            {item.DoctorSpecialization}
                        </ThemedText>
                    </View>
                </View>
                <View
                    style={[
                        styles.statusBadge,
                        {
                            backgroundColor:
                                getStatusColor(item.AppointmentStatus) + "20",
                        },
                    ]}
                >
                    <ThemedText
                        style={[
                            styles.statusText,
                            { color: getStatusColor(item.AppointmentStatus) },
                        ]}
                    >
                        {getStatusText(item.AppointmentStatus)}
                    </ThemedText>
                </View>
            </View>

            <View style={styles.appointmentDetails}>
                <View style={styles.detailItem}>
                    <Ionicons
                        name="calendar"
                        size={20}
                        color={colors.patientPrimary}
                    />
                    <ThemedText style={styles.detailText}>
                        {item.AppointmentDate}
                    </ThemedText>
                </View>
                <View style={styles.detailItem}>
                    <Ionicons
                        name="time"
                        size={20}
                        color={colors.patientPrimary}
                    />
                    <ThemedText style={styles.detailText}>
                        {item.AppointmentTime}
                    </ThemedText>
                </View>
            </View>

            <ThemedText style={[styles.reason, { color: colors.textLight }]}>
                {item.AppointmentReason}
            </ThemedText>

            {(item.AppointmentStatus.toLowerCase() === "pending" ||
                item.AppointmentStatus.toLowerCase() === "rescheduled") && (
                <View style={styles.actionButtons}>
                    <TouchableOpacity
                        style={[
                            styles.actionButton,
                            { backgroundColor: colors.error + "20" },
                        ]}
                        onPress={() => handleCancelAppointment(item)}
                    >
                        <Ionicons
                            name="close-circle"
                            size={20}
                            color={colors.error}
                        />
                        <ThemedText
                            style={[
                                styles.actionButtonText,
                                { color: colors.error },
                            ]}
                        >
                            Cancel
                        </ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.actionButton,
                            { backgroundColor: colors.patientPrimary + "20" },
                        ]}
                        onPress={() => handleRescheduleAppointment(item)}
                    >
                        <Ionicons
                            name="calendar"
                            size={20}
                            color={colors.patientPrimary}
                        />
                        <ThemedText
                            style={[
                                styles.actionButtonText,
                                { color: colors.patientPrimary },
                            ]}
                        >
                            Reschedule
                        </ThemedText>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchAppointments();
        setRefreshing(false);
    }, []);

    return (
        <ScrollView
            style={[
                globalStyles.container,
                styles.container,
                { backgroundColor: colors.background },
            ]}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    colors={[colors.patientPrimary]} // Android
                    tintColor={colors.patientPrimary} // iOS
                    progressBackgroundColor={colors.background} // Android
                />
            }
        >
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
                        Appointments
                    </ThemedText>
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={() =>
                            router.push("/patient/appointments/book" as any)
                        }
                    >
                        <Ionicons
                            name="add"
                            size={24}
                            color={colors.background}
                        />
                    </TouchableOpacity>
                </View>

                {/* Tabs */}
                <View style={styles.tabs}>
                    <TouchableOpacity
                        style={[
                            styles.tab,
                            activeTab === "upcoming" && {
                                backgroundColor: colors.background,
                            },
                        ]}
                        onPress={() => setActiveTab("upcoming")}
                    >
                        <ThemedText
                            style={[
                                styles.tabText,
                                {
                                    color:
                                        activeTab === "upcoming"
                                            ? colors.patientPrimary
                                            : colors.background,
                                },
                            ]}
                        >
                            Upcoming
                        </ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.tab,
                            activeTab === "past" && {
                                backgroundColor: colors.background,
                            },
                        ]}
                        onPress={() => setActiveTab("past")}
                    >
                        <ThemedText
                            style={[
                                styles.tabText,
                                {
                                    color:
                                        activeTab === "past"
                                            ? colors.patientPrimary
                                            : colors.background,
                                },
                            ]}
                        >
                            Past
                        </ThemedText>
                    </TouchableOpacity>
                </View>
            </LinearGradient>
            {filteredAppointments.length === 0 && (
                <View style={styles.noAppointmentsContainer}>
                    <ThemedText style={styles.noAppointmentsText}>
                        No appointments found
                    </ThemedText>
                </View>
            )}
            <View style={styles.appointmentsList}>
                {filteredAppointments.map((appointment, index) =>
                    renderAppointment({ item: appointment, key: index }),
                )}
            </View>

            {/* Cancel Confirmation Modal */}
            <Modal
                visible={showCancelModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowCancelModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View
                        style={[
                            styles.modalContent,
                            { backgroundColor: colors.background },
                        ]}
                    >
                        <ThemedText style={styles.modalTitle}>
                            Cancel Appointment
                        </ThemedText>
                        <ThemedText style={styles.modalMessage}>
                            Are you sure you want to cancel this appointment?
                            This action cannot be undone.
                        </ThemedText>
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[
                                    styles.modalButton,
                                    { backgroundColor: colors.error + "20" },
                                ]}
                                onPress={() => setShowCancelModal(false)}
                            >
                                <ThemedText
                                    style={[
                                        styles.modalButtonText,
                                        { color: colors.error },
                                    ]}
                                >
                                    No, Keep It
                                </ThemedText>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.modalButton,
                                    { backgroundColor: colors.error },
                                ]}
                                onPress={confirmCancelAppointment}
                            >
                                <ThemedText
                                    style={[
                                        styles.modalButtonText,
                                        { color: colors.background },
                                    ]}
                                >
                                    Yes, Cancel
                                </ThemedText>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
};

export default AppointmentsScreen;

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
        marginBottom: 20,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: "bold",
    },
    addButton: {
        padding: 8,
    },
    tabs: {
        flexDirection: "row",
        backgroundColor: "rgba(255, 255, 255, 0.2)",
        borderRadius: 12,
        padding: 4,
    },
    tab: {
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignItems: "center",
    },
    tabText: {
        fontSize: 16,
        fontWeight: "600",
    },
    appointmentsList: {
        padding: 20,
    },
    appointmentCard: {
        padding: 16,
        borderRadius: 16,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    appointmentHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 16,
    },
    doctorInfo: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
    },
    avatarText: {
        fontSize: 18,
        fontWeight: "600",
    },
    doctorName: {
        fontSize: 16,
        fontWeight: "600",
    },
    specialization: {
        fontSize: 14,
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 16,
    },
    statusText: {
        fontSize: 12,
        fontWeight: "600",
    },
    appointmentDetails: {
        marginBottom: 12,
    },
    detailItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 8,
    },
    detailText: {
        fontSize: 14,
    },
    reason: {
        fontSize: 14,
        marginBottom: 16,
    },
    actionButtons: {
        flexDirection: "row",
        gap: 12,
    },
    actionButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        padding: 12,
        borderRadius: 8,
    },
    actionButtonText: {
        fontSize: 14,
        fontWeight: "600",
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    modalContent: {
        width: "100%",
        borderRadius: 16,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 12,
        textAlign: "center",
    },
    modalMessage: {
        fontSize: 16,
        textAlign: "center",
        marginBottom: 20,
        color: "#666",
    },
    modalButtons: {
        flexDirection: "row",
        gap: 12,
    },
    modalButton: {
        flex: 1,
        padding: 16,
        borderRadius: 8,
        alignItems: "center",
    },
    modalButtonText: {
        fontSize: 16,
        fontWeight: "600",
    },
    noAppointmentsContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    noAppointmentsText: {
        fontSize: 16,
        fontWeight: "600",
    },
});
