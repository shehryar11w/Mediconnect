import { ThemedText } from "@/components/ThemedText";
import { useAuth } from "@/context/authContext";
import { appointmentService } from "@/services/appointmentService";
import dashboardService from "@/services/dashboardService";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
    Alert,
    Dimensions,
    RefreshControl,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import { useColorScheme } from "../../hooks/useColorScheme";
import { createGlobalStyles } from "../../theme/styles";

const { width } = Dimensions.get("window");

const Dashboard = () => {
    const { colors } = useColorScheme();
    const globalStyles = createGlobalStyles(colors);
    const { currentUser } = useAuth();
    const [NextAppointment, setNextAppointment] = useState<any>(null);
    const [upcomingAppointments, setUpcomingAppointments] = useState<any>([]);
    const [recentPrescriptions, setRecentPrescriptions] = useState<any>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [showCompleteButton, setShowCompleteButton] = useState(false);

    function formatDateTime(input: string) {
        console.log("input", input);
        const inputDate = new Date(input);
        const now = new Date();

        // Normalize times for comparison
        const inputDateOnly = new Date(
            inputDate.getFullYear(),
            inputDate.getMonth(),
            inputDate.getDate(),
        );
        const today = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
        );
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        let dayLabel;
        if (inputDateOnly.getTime() === today.getTime()) {
            dayLabel = "Today";
        } else if (inputDateOnly.getTime() === tomorrow.getTime()) {
            dayLabel = "Tomorrow";
        } else {
            const weekdays = [
                "Sunday",
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
            ];
            dayLabel = weekdays[inputDate.getDay()];
        }

        const day = inputDate.getDate();
        const month = inputDate.toLocaleString("default", { month: "long" });

        let hours = inputDate.getHours();
        const minutes = inputDate.getMinutes().toString().padStart(2, "0");
        const ampm = hours >= 12 ? "PM" : "AM";
        hours = hours % 12 || 12; // Convert to 12-hour format

        return `${dayLabel}, ${day} ${month} at ${hours}:${minutes} ${ampm}`;
    }

    const fetchPatientDetails = async () => {
        try {
            const todaysAppointmentRes =
                await dashboardService.getNextAppointment(currentUser?.id);
            if (todaysAppointmentRes.data) {
                const appointmentDoc =
                    todaysAppointmentRes.data.appointment._doc;
                appointmentDoc.FormattedDateTime = formatDateTime(
                    appointmentDoc.AppointmentStartDateTime,
                );
                appointmentDoc.doctorName =
                    todaysAppointmentRes.data.appointment.doctorName;
                setNextAppointment(appointmentDoc);
            } else {
                setNextAppointment(null);
            }
        } catch (error) {
            console.log("error", error);
            setNextAppointment(null);
        }
        try {
            const upcomingAppointmentsRes =
                await dashboardService.getFutureAppointments(currentUser?.id);
            setUpcomingAppointments(upcomingAppointmentsRes.data);
            console.log(
                "upcomingAppointmentsRes",
                upcomingAppointmentsRes.data,
            );
        } catch (error) {
            console.log("error", error);
            // Alert.alert('Error', 'Failed to fetch upcoming appointments');
        }
        try {
            const recentPrescriptionsRes =
                await dashboardService.getActivePrescriptions(currentUser?.id);
            setRecentPrescriptions(recentPrescriptionsRes.data);
            // console.log("recentPrescriptionsRes", recentPrescriptionsRes.data);
        } catch (error) {
            console.log("error", error);
            // Alert.alert('Error', 'Failed to fetch recent prescriptions');
        }
    };

    useEffect(() => {
        fetchPatientDetails();
    }, []);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchPatientDetails();
        setRefreshing(false);
    }, []);

    const checkAppointmentTime = useCallback(() => {
        if (!NextAppointment) return;

        const now = new Date();
        const startTime = new Date(NextAppointment.AppointmentStartDateTime);
        const endTime = new Date(NextAppointment.AppointmentEndDateTime);

        // Add 15 minutes to end time
        const extendedEndTime = new Date(endTime.getTime() + 15 * 60000);

        // Check if current time is between start time and extended end time
        const isWithinTimeRange = now >= startTime && now <= extendedEndTime;
        setShowCompleteButton(isWithinTimeRange);
    }, [NextAppointment]);

    useEffect(() => {
        checkAppointmentTime();
        // Check every minute
        const interval = setInterval(checkAppointmentTime, 60000);
        return () => clearInterval(interval);
    }, [checkAppointmentTime]);

    const handleCompleteAppointment = async () => {
        try {
            // Here you would typically make an API call to mark the appointment as completed
            Alert.alert(
                "Complete Appointment",
                "Are you sure you want to mark this appointment as completed?",
                [
                    {
                        text: "Cancel",
                        style: "cancel",
                    },
                    {
                        text: "Complete",
                        onPress: async () => {
                            try {
                                // Add your API call here to mark appointment as completed
                                const res =
                                    await appointmentService.completeAppointment(
                                        NextAppointment.AppointmentId,
                                    );
                                if (res.success) {
                                    Alert.alert(
                                        "Success",
                                        "Appointment marked as completed",
                                    );
                                    fetchPatientDetails(); // Refresh the data
                                } else {
                                    Alert.alert(
                                        "Error",
                                        "Failed to complete appointment",
                                    );
                                }
                            } catch (error) {
                                console.log("error", error);
                                Alert.alert(
                                    "Error",
                                    "Failed to complete appointment",
                                );
                            }
                        },
                    },
                ],
            );
        } catch (error) {
            console.log("error", error);
            Alert.alert("Error", "Failed to complete appointment");
        }
    };

    const quickActions = [
        {
            title: "View Appointments",
            icon: "calendar",
            route: "/patient/appointments",
        },
        {
            title: "View Reports",
            icon: "document-text",
            route: "/patient/reports",
        },
        {
            title: "Give Feedback",
            icon: "chatbubble",
            route: "/patient/feedback",
        },
        { title: "View Receipts", icon: "receipt", route: "/patient/receipts" },
    ];

    const renderQuickAction = (action: (typeof quickActions)[0]) => (
        <TouchableOpacity
            key={action.title}
            style={[
                styles.quickActionCard,
                {
                    backgroundColor: colors.background,
                    shadowColor: colors.shadow,
                },
            ]}
            onPress={() => router.push(action.route as any)}
        >
            <View
                style={[
                    styles.quickActionIcon,
                    { backgroundColor: colors.patientPrimary + "20" },
                ]}
            >
                <Ionicons
                    name={action.icon as any}
                    size={24}
                    color={colors.patientPrimary}
                />
            </View>
            <ThemedText style={styles.quickActionTitle}>
                {action.title}
            </ThemedText>
        </TouchableOpacity>
    );

    return (
        <ScrollView
            style={[globalStyles.container, styles.container]}
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
                    <View>
                        <ThemedText
                            style={[
                                styles.greeting,
                                { color: colors.background },
                            ]}
                        >
                            Good Morning,
                        </ThemedText>
                        <ThemedText
                            style={[styles.name, { color: colors.background }]}
                        >
                            {currentUser.name ? currentUser.name : "Patient"}
                        </ThemedText>
                    </View>
                    <View style={styles.headerButtons}>
                        <TouchableOpacity
                            style={styles.headerButton}
                            onPress={() => router.push("/patient/chat" as any)}
                        >
                            <Ionicons
                                name="chatbubble"
                                size={24}
                                color={colors.background}
                            />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.headerButton}
                            onPress={() =>
                                router.push("/patient/profile/profile" as any)
                            }
                        >
                            <Ionicons
                                name="person-circle"
                                size={24}
                                color={colors.background}
                            />
                        </TouchableOpacity>
                    </View>
                </View>
            </LinearGradient>

            {/* Next Appointment Card */}
            <View
                style={[
                    styles.nextAppointmentCard,
                    {
                        backgroundColor: colors.background,
                        marginTop: NextAppointment ? 0 : -20,
                        shadowColor: colors.shadow,
                    },
                ]}
            >
                <View style={styles.nextAppointmentHeader}>
                    <Ionicons
                        name="calendar"
                        size={24}
                        color={colors.patientPrimary}
                    />
                    <ThemedText style={styles.nextAppointmentTitle}>
                        Next Appointment
                    </ThemedText>
                </View>
                {NextAppointment ? (
                    <>
                        <ThemedText style={styles.nextAppointmentTime}>
                            {NextAppointment.FormattedDateTime}
                        </ThemedText>
                        <ThemedText
                            style={[
                                styles.nextAppointmentDoctor,
                                { color: colors.textLight },
                            ]}
                        >
                            with Dr.{NextAppointment.doctorName}
                        </ThemedText>
                        {showCompleteButton && (
                            <TouchableOpacity
                                style={[
                                    styles.completeButton,
                                    { backgroundColor: colors.patientPrimary },
                                ]}
                                onPress={handleCompleteAppointment}
                            >
                                <ThemedText
                                    style={[
                                        styles.completeButtonText,
                                        { color: colors.background },
                                    ]}
                                >
                                    Complete Appointment
                                </ThemedText>
                            </TouchableOpacity>
                        )}
                    </>
                ) : (
                    <ThemedText style={styles.nextAppointmentTime}>
                        No upcoming appointments
                    </ThemedText>
                )}
            </View>

            {/* Quick Actions */}
            <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>
                    Quick Actions
                </ThemedText>
                <View style={styles.quickActionsGrid}>
                    {quickActions.map(renderQuickAction)}
                </View>
            </View>

            {/* Upcoming Appointments */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <ThemedText style={styles.sectionTitle}>
                        Upcoming Appointments
                    </ThemedText>
                    <TouchableOpacity
                        style={styles.seeAllButton}
                        onPress={() =>
                            router.push("/patient/appointments" as any)
                        }
                    >
                        <ThemedText
                            style={[
                                styles.seeAll,
                                { color: colors.patientPrimary },
                            ]}
                        >
                            View All
                        </ThemedText>
                        <Ionicons
                            name="chevron-forward"
                            size={16}
                            color={colors.patientPrimary}
                        />
                    </TouchableOpacity>
                </View>

                {upcomingAppointments.length > 0 ? (
                    upcomingAppointments.map(
                        (appointment: any, index: number) => (
                            <View
                                key={index}
                                style={[
                                    styles.appointmentCard,
                                    {
                                        backgroundColor: colors.background,
                                        shadowColor: colors.shadow,
                                    },
                                ]}
                            >
                                <View
                                    style={[
                                        styles.timeContainer,
                                        {
                                            backgroundColor:
                                                colors.patientPrimary,
                                        },
                                    ]}
                                >
                                    <ThemedText
                                        style={[
                                            styles.time,
                                            { color: colors.background },
                                        ]}
                                    >
                                        {appointment.AppointmentStartDateTime.split(
                                            "T",
                                        )[1]
                                            .split(".")[0]
                                            .split(":")
                                            .slice(0, 2)
                                            .join(":")}
                                    </ThemedText>
                                </View>
                                <View style={styles.appointmentInfo}>
                                    <ThemedText style={styles.doctorName}>
                                        Dr.{appointment.doctorName}
                                    </ThemedText>
                                </View>
                                <View
                                    style={[
                                        styles.statusBadge,
                                        {
                                            backgroundColor:
                                                appointment.AppointmentStatus ===
                                                "Confirmed"
                                                    ? colors.confirmed + "20"
                                                    : colors.pending + "20",
                                        },
                                    ]}
                                >
                                    <ThemedText
                                        style={[
                                            styles.statusText,
                                            {
                                                color:
                                                    appointment.AppointmentStatus ===
                                                    "Confirmed"
                                                        ? colors.confirmed
                                                        : colors.pending,
                                            },
                                        ]}
                                    >
                                        {appointment.AppointmentStatus.charAt(
                                            0,
                                        ).toUpperCase() +
                                            appointment.AppointmentStatus.slice(
                                                1,
                                            )}
                                    </ThemedText>
                                </View>
                            </View>
                        ),
                    )
                ) : (
                    <ThemedText style={styles.noAppointments}>
                        No upcoming appointments
                    </ThemedText>
                )}
            </View>

            {/* Recent Prescriptions */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <ThemedText style={styles.sectionTitle}>
                        Active Prescriptions
                    </ThemedText>
                    <TouchableOpacity
                        style={styles.seeAllButton}
                        onPress={() =>
                            router.push("/patient/prescriptions" as any)
                        }
                    >
                        <ThemedText
                            style={[
                                styles.seeAll,
                                { color: colors.patientPrimary },
                            ]}
                        >
                            View All
                        </ThemedText>
                        <Ionicons
                            name="chevron-forward"
                            size={16}
                            color={colors.patientPrimary}
                        />
                    </TouchableOpacity>
                </View>

                {recentPrescriptions.length > 0 ? (
                    recentPrescriptions.map(
                        (prescription: any, index: number) => (
                            <View
                                key={index}
                                style={[
                                    styles.prescriptionCard,
                                    {
                                        backgroundColor: colors.background,
                                        shadowColor: colors.shadow,
                                    },
                                ]}
                            >
                                <View style={styles.prescriptionInfo}>
                                    <ThemedText style={styles.medicationName}>
                                        {prescription.PrescriptionMedicine}
                                    </ThemedText>
                                    <ThemedText
                                        style={[
                                            styles.medicationDetails,
                                            { color: colors.textLight },
                                        ]}
                                    >
                                        {prescription.PrescriptionDosage} •{" "}
                                        {prescription.PrescriptionFrequency}
                                    </ThemedText>
                                </View>
                            </View>
                        ),
                    )
                ) : (
                    <ThemedText style={styles.noAppointments}>
                        No active prescriptions
                    </ThemedText>
                )}
            </View>
        </ScrollView>
    );
};

export default Dashboard;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerGradient: {
        marginHorizontal: 0,
        paddingTop: 60,
        paddingBottom: 30,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    greeting: {
        fontSize: 16,
        opacity: 0.9,
    },
    name: {
        fontSize: 28,
        fontWeight: "bold",
    },
    headerButtons: {
        flexDirection: "row",
        gap: 12,
    },
    headerButton: {
        padding: 8,
    },
    nextAppointmentCard: {
        marginHorizontal: 20,
        paddingBottom: 10,
        padding: 20,
        borderRadius: 20,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    nextAppointmentHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
    },
    nextAppointmentTitle: {
        fontSize: 18,
        fontWeight: "600",
        marginLeft: 8,
    },
    nextAppointmentTime: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 4,
    },
    nextAppointmentDoctor: {
        fontSize: 16,
        marginBottom: 16,
    },
    rescheduleButton: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
        alignSelf: "flex-start",
    },
    rescheduleText: {
        fontSize: 16,
        fontWeight: "600",
    },
    section: {
        padding: 20,
    },
    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: "bold",
    },
    seeAllButton: {
        flexDirection: "row",
        alignItems: "center",
    },
    seeAll: {
        fontSize: 14,
        marginRight: 4,
    },
    quickActionsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        gap: 12,
    },
    quickActionCard: {
        width: width * 0.43,
        padding: 16,
        borderRadius: 20,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    quickActionIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 12,
    },
    quickActionTitle: {
        fontSize: 16,
        fontWeight: "600",
    },
    appointmentCard: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        borderRadius: 20,
        marginBottom: 12,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    timeContainer: {
        padding: 8,
        borderRadius: 12,
        marginRight: 12,
    },
    time: {
        fontSize: 14,
        fontWeight: "600",
    },
    appointmentInfo: {
        flex: 1,
    },
    doctorName: {
        fontSize: 16,
        fontWeight: "600",
    },
    appointmentType: {
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
        fontWeight: "600",
    },
    prescriptionCard: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
        borderRadius: 20,
        marginBottom: 12,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    prescriptionInfo: {
        flex: 1,
    },
    medicationName: {
        fontSize: 16,
        fontWeight: "600",
    },
    medicationDetails: {
        fontSize: 14,
        marginTop: 4,
    },
    completeButton: {
        marginTop: 16,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
        alignSelf: "flex-start",
    },
    completeButtonText: {
        fontSize: 16,
        fontWeight: "600",
    },
    noAppointments: {
        fontSize: 16,
        fontWeight: "600",
        textAlign: "center",
        marginTop: 20,
    },
});
