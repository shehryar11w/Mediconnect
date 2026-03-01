import { ThemedText } from "@/components/ThemedText";
import { useAuth } from "@/context/authContext";
import dashboardService from "@/services/dashboardService";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
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
    const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([]);
    const [recentPatients, setRecentPatients] = useState<any[]>([]);
    const [todaysAppointments, setTodaysAppointments] = useState<any[]>([]);
    const [totalPatients, setTotalPatients] = useState<number>(0);
    const [doctorData, setDoctorData] = useState<any>({});
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        void fetchData();
        setRefreshing(false);
    }, []);
    async function fetchData() {
        try {
            let res = await dashboardService.getTodaysAppointments(
                currentUser?.id,
            );
            setUpcomingAppointments(res.data);
            // console.log("Upcoming Appointments", res.data);
            res = await dashboardService.getRecentPatients(currentUser?.id);
            setRecentPatients(res.data);
            // console.log("Recent Patients", res.data);
            res = await dashboardService.getTodaysAppointments(currentUser?.id);
            setTodaysAppointments(res.data);
            // console.log("Todays Appointments", res.data);
            res = await dashboardService.getTotalPatients(currentUser?.id);
            setTotalPatients(res.data.totalPatients);
            // console.log("Total Patients", res.data.totalPatients);
            res = await dashboardService.getDoctorData(currentUser?.id);
            setDoctorData(res.data);
            // console.log("Doctor Data", res.data);
        } catch (error) {
            console.log("error", error);
        }
    }
    useEffect(() => {
        if (currentUser) {
            void fetchData();
        }
    }, [currentUser]);

    const metrics = [
        {
            title: "Today's Appointments",
            value: todaysAppointments.length,
            icon: "calendar",
        },
        { title: "Total Patients", value: totalPatients, icon: "people" },
    ];

    const quickActions = [
        {
            title: "View Feedbacks",
            icon: "chatbubble",
            route: "/doctor/feedback",
        },
        {
            title: "View Analytics",
            icon: "document-text",
            route: "/doctor/analytics",
        },
    ];

    const formatTime = (date: string) => {
        return new Date(date).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });
    };

    const renderQuickAction = (action: (typeof quickActions)[0]) => (
        <TouchableOpacity
            key={action.title}
            style={[
                styles.quickActionCard,
                { backgroundColor: colors.background },
            ]}
            onPress={() => router.push(action.route as any)}
        >
            <View
                style={[
                    styles.quickActionIcon,
                    { backgroundColor: colors.doctorPrimary + "20" },
                ]}
            >
                <Ionicons
                    name={action.icon as any}
                    size={24}
                    color={colors.doctorPrimary}
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
                    colors={[colors.doctorPrimary]} // Android
                    tintColor={colors.doctorPrimary} // iOS
                    progressBackgroundColor={colors.background} // Android
                />
            }
        >
            {/* Header with Gradient */}
            <LinearGradient
                colors={[colors.doctorPrimary, colors.doctorPrimary + "CC"]}
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
                            {"Dr. " + doctorData.DoctorName}
                        </ThemedText>
                    </View>
                    <View style={styles.headerButtons}>
                        <TouchableOpacity
                            style={[
                                styles.headerButton,
                                { backgroundColor: colors.background + "20" },
                            ]}
                            onPress={() => router.push("/doctor/chat" as any)}
                        >
                            <Ionicons
                                name="chatbubble"
                                size={24}
                                color={colors.background}
                            />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.headerButton,
                                { backgroundColor: colors.background + "20" },
                            ]}
                            onPress={() =>
                                router.push("/doctor/profile/profile" as any)
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

            {/* Quick Stats */}
            <View style={styles.metricsContainer}>
                {metrics.map((metric, index) => (
                    <View
                        key={index}
                        style={[
                            styles.metricCard,
                            { backgroundColor: colors.background },
                        ]}
                    >
                        <View style={styles.metricHeader}>
                            <View
                                style={[
                                    styles.metricIcon,
                                    {
                                        backgroundColor:
                                            colors.doctorPrimary + "20",
                                    },
                                ]}
                            >
                                <Ionicons
                                    name={metric.icon as any}
                                    size={24}
                                    color={colors.doctorPrimary}
                                />
                            </View>
                        </View>
                        <ThemedText style={styles.metricValue}>
                            {metric.value}
                        </ThemedText>
                        <ThemedText
                            style={[
                                styles.metricTitle,
                                { color: colors.textLight },
                            ]}
                        >
                            {metric.title}
                        </ThemedText>
                    </View>
                ))}
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
                        Today&apos;s Schedule
                    </ThemedText>
                    <TouchableOpacity
                        style={styles.seeAllButton}
                        onPress={() => router.push("/doctor/calendar")}
                    >
                        <ThemedText
                            style={[
                                styles.seeAll,
                                { color: colors.doctorPrimary },
                            ]}
                        >
                            View All
                        </ThemedText>
                        <Ionicons
                            name="chevron-forward"
                            size={16}
                            color={colors.doctorPrimary}
                        />
                    </TouchableOpacity>
                </View>

                {upcomingAppointments.length > 0 ? (
                    upcomingAppointments.map((appointment, index) => (
                        <View
                            key={index}
                            style={[
                                styles.appointmentCard,
                                { backgroundColor: colors.background },
                            ]}
                        >
                            <View
                                style={[
                                    styles.timeContainer,
                                    { backgroundColor: colors.doctorPrimary },
                                ]}
                            >
                                <ThemedText
                                    style={[
                                        styles.time,
                                        { color: colors.background },
                                    ]}
                                >
                                    {formatTime(
                                        appointment.AppointmentStartDateTime,
                                    )}
                                </ThemedText>
                            </View>
                            <View style={styles.appointmentInfo}>
                                <ThemedText style={styles.patientName}>
                                    {appointment.patient.PatientName}
                                </ThemedText>
                            </View>
                            <View
                                style={[
                                    styles.statusBadge,
                                    {
                                        backgroundColor:
                                            appointment.AppointmentStatus ===
                                            "Confirmed"
                                                ? "#4CAF50" + "20"
                                                : "#FFA000" + "20",
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
                                                    ? "#4CAF50"
                                                    : "#FFA000",
                                        },
                                    ]}
                                >
                                    {appointment.AppointmentStatus.charAt(
                                        0,
                                    ).toUpperCase() +
                                        appointment.AppointmentStatus.slice(1)}
                                </ThemedText>
                            </View>
                        </View>
                    ))
                ) : (
                    <ThemedText style={styles.noAppointments}>
                        No appointments today
                    </ThemedText>
                )}
            </View>

            {/* Recent Patients */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <ThemedText style={styles.sectionTitle}>
                        Recent Patients
                    </ThemedText>
                    <TouchableOpacity
                        style={styles.seeAllButton}
                        onPress={() => router.push("/doctor/patients")}
                    >
                        <ThemedText
                            style={[
                                styles.seeAll,
                                { color: colors.doctorPrimary },
                            ]}
                        >
                            View All
                        </ThemedText>
                        <Ionicons
                            name="chevron-forward"
                            size={16}
                            color={colors.doctorPrimary}
                        />
                    </TouchableOpacity>
                </View>

                {recentPatients.length > 0 ? (
                    recentPatients.map((patient, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.patientCard,
                                { backgroundColor: colors.background },
                            ]}
                            onPress={() =>
                                router.push(
                                    `/doctor/patient/${patient.PatientId}`,
                                )
                            }
                        >
                            <View style={styles.patientInfo}>
                                <ThemedText style={styles.patientName}>
                                    {patient.PatientName}
                                </ThemedText>
                            </View>
                            <View style={styles.patientMeta}>
                                <Ionicons
                                    name="chevron-forward"
                                    size={20}
                                    color={colors.textLight}
                                />
                            </View>
                        </TouchableOpacity>
                    ))
                ) : (
                    <ThemedText style={styles.noAppointments}>
                        No recent patients
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
        borderRadius: 12,
    },
    metricsContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        marginTop: -20,
        gap: 16,
    },
    metricCard: {
        flex: 1,
        padding: 16,
        borderRadius: 20,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    metricHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    metricIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
    },
    trend: {
        fontSize: 14,
        fontWeight: "600",
    },
    metricValue: {
        fontSize: 28,
        fontWeight: "bold",
        marginBottom: 4,
    },
    metricTitle: {
        fontSize: 14,
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
        padding: 8,
    },
    seeAll: {
        fontSize: 14,
        fontWeight: "600",
        marginRight: 4,
    },
    quickActionsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 16,
    },
    quickActionCard: {
        flex: 1,
        minWidth: width * 0.4,
        padding: 20,
        borderRadius: 20,
        shadowColor: "#000",
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
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    timeContainer: {
        padding: 12,
        borderRadius: 12,
        marginRight: 16,
        minWidth: 80,
        alignItems: "center",
    },
    time: {
        fontSize: 14,
        fontWeight: "600",
    },
    appointmentInfo: {
        flex: 1,
    },
    patientName: {
        fontSize: 16,
        fontWeight: "600",
        marginBottom: 4,
    },
    appointmentType: {
        fontSize: 14,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginLeft: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: "600",
    },
    patientCard: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
        borderRadius: 20,
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
    patientInfo: {
        flex: 1,
    },
    patientCondition: {
        fontSize: 14,
        marginTop: 4,
    },
    patientMeta: {
        flexDirection: "row",
        alignItems: "center",
    },
    lastVisit: {
        fontSize: 12,
        marginRight: 8,
    },
    noAppointments: {
        fontSize: 16,
        fontWeight: "600",
        textAlign: "center",
        marginTop: 20,
    },
});
