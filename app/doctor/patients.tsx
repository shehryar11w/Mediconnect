import { ThemedText } from "@/components/ThemedText";
import { useAuth } from "@/context/authContext";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useColorScheme } from "../../hooks/useColorScheme";
import dashboardService from "../../services/dashboardService";
import { createGlobalStyles } from "../../theme/styles";

type Patient = {
    id: string;
    name: string;
    age: number;
    gender: "Male" | "Female";
    condition: string[];
    nextAppointment?: string;
    status: "Active" | "Inactive";
};

const PatientsScreen = () => {
    const { colors } = useColorScheme();
    const globalStyles = createGlobalStyles(colors);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedFilter, setSelectedFilter] = useState<
        "all" | "active" | "inactive"
    >("all");
    const [patients, setPatients] = useState<Patient[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { currentUser } = useAuth();
    useEffect(() => {
        fetchPatients();
    }, []);

    const fetchPatients = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await dashboardService.getAllPatients(
                currentUser.id,
            );
            console.log("Patients", response.data);
            if (response.success) {
                const formattedPatients = response.data.map((patient: any) => ({
                    id: patient.PatientId.toString(),
                    name: patient.PatientName,
                    age: patient.PatientAge,
                    gender: patient.PatientGender,
                    condition: patient.PatientMedicalRecord || "Not specified",
                    nextAppointment: patient.NextAppointmentDate
                        ? new Date(
                              patient.NextAppointmentDate,
                          ).toLocaleDateString()
                        : undefined,
                    status: "Active",
                }));
                setPatients(formattedPatients);
            }
        } catch (error) {
            console.error("Error fetching patients:", error);
            setError(
                error instanceof Error
                    ? error.message
                    : "Failed to fetch patients",
            );
        } finally {
            setIsLoading(false);
        }
    };

    const filteredPatients = patients.filter((patient) => {
        const matchesSearch =
            patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            patient.condition.some((condition) =>
                condition.toLowerCase().includes(searchQuery.toLowerCase()),
            );
        const matchesFilter =
            selectedFilter === "all" ||
            patient.status.toLowerCase() === selectedFilter;
        return matchesSearch && matchesFilter;
    });

    const renderPatientCard = (patient: Patient) => (
        <TouchableOpacity
            key={patient.id}
            style={[styles.patientCard, { backgroundColor: colors.background }]}
            onPress={() => router.push(`/doctor/patient/${patient.id}`)}
        >
            <View style={styles.patientHeader}>
                <View style={styles.patientInfo}>
                    <ThemedText style={styles.patientName}>
                        {patient.name}
                    </ThemedText>
                    <View style={styles.patientMeta}>
                        <ThemedText
                            style={[
                                styles.patientMetaText,
                                { color: colors.textLight },
                            ]}
                        >
                            {patient.age} years • {patient.gender}
                        </ThemedText>
                    </View>
                </View>
                <View
                    style={[
                        styles.statusBadge,
                        {
                            backgroundColor:
                                patient.status === "Active"
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
                                    patient.status === "Active"
                                        ? "#4CAF50"
                                        : "#FFA000",
                            },
                        ]}
                    >
                        {patient.status}
                    </ThemedText>
                </View>
            </View>

            <View style={styles.patientDetails}>
                {patient.condition.map((condition, index) => (
                    <View key={index} style={styles.detailRow}>
                        <Ionicons
                            name="medical"
                            size={16}
                            color={colors.textLight}
                        />
                        <ThemedText
                            style={[
                                styles.detailText,
                                { color: colors.textLight },
                            ]}
                        >
                            {condition}
                        </ThemedText>
                    </View>
                ))}
                {patient.nextAppointment && (
                    <View style={styles.detailRow}>
                        <Ionicons
                            name="calendar-outline"
                            size={16}
                            color={colors.doctorPrimary}
                        />
                        <ThemedText
                            style={[
                                styles.detailText,
                                { color: colors.doctorPrimary },
                            ]}
                        >
                            Next: {patient.nextAppointment}
                        </ThemedText>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={[globalStyles.container, styles.container]}>
            {/* Header */}
            <View
                style={[styles.header, { backgroundColor: colors.background }]}
            >
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <ThemedText style={styles.headerTitle}>Patients</ThemedText>
            </View>

            {/* Search and Filter */}
            <View
                style={[
                    styles.searchContainer,
                    { backgroundColor: colors.background },
                ]}
            >
                <View
                    style={[
                        styles.searchBar,
                        { backgroundColor: colors.background },
                    ]}
                >
                    <Ionicons
                        name="search"
                        size={20}
                        color={colors.textLight}
                    />
                    <TextInput
                        style={[styles.searchInput, { color: colors.text }]}
                        placeholder="Search patients..."
                        placeholderTextColor={colors.textLight}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
                <View style={styles.filterContainer}>
                    {(["all", "active", "inactive"] as const).map((filter) => (
                        <TouchableOpacity
                            key={filter}
                            style={[
                                styles.filterButton,
                                {
                                    backgroundColor:
                                        selectedFilter === filter
                                            ? colors.doctorPrimary
                                            : colors.background,
                                },
                            ]}
                            onPress={() => setSelectedFilter(filter)}
                        >
                            <ThemedText
                                style={[
                                    styles.filterText,
                                    {
                                        color:
                                            selectedFilter === filter
                                                ? colors.background
                                                : colors.text,
                                    },
                                ]}
                            >
                                {filter.charAt(0).toUpperCase() +
                                    filter.slice(1)}
                            </ThemedText>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Patients List */}
            <ScrollView style={styles.patientsContainer}>
                {isLoading ? (
                    <View
                        style={[
                            styles.emptyState,
                            { backgroundColor: colors.background },
                        ]}
                    >
                        <ActivityIndicator
                            size="large"
                            color={colors.doctorPrimary}
                        />
                        <ThemedText
                            style={[
                                styles.emptyStateText,
                                { color: colors.textLight },
                            ]}
                        >
                            Loading patients...
                        </ThemedText>
                    </View>
                ) : error ? (
                    <View
                        style={[
                            styles.emptyState,
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
                                styles.emptyStateText,
                                { color: colors.error },
                            ]}
                        >
                            {error}
                        </ThemedText>
                        <TouchableOpacity
                            style={[
                                styles.retryButton,
                                { backgroundColor: colors.doctorPrimary },
                            ]}
                            onPress={fetchPatients}
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
                ) : filteredPatients.length > 0 ? (
                    filteredPatients.map(renderPatientCard)
                ) : (
                    <View
                        style={[
                            styles.emptyState,
                            { backgroundColor: colors.background },
                        ]}
                    >
                        <Ionicons
                            name="people-outline"
                            size={48}
                            color={colors.textLight}
                        />
                        <ThemedText
                            style={[
                                styles.emptyStateText,
                                { color: colors.textLight },
                            ]}
                        >
                            No patients found
                        </ThemedText>
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

export default PatientsScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: "#E5E5E5",
    },
    backButton: {
        padding: 20,
        paddingTop: 60,
        position: "absolute",
        left: 0,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: "bold",
        textAlign: "center",
        justifyContent: "center",
        alignItems: "center",
    },
    searchContainer: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#E5E5E5",
    },
    searchBar: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#E5E5E5",
        marginBottom: 12,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 16,
    },
    filterContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    filterButton: {
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        marginHorizontal: 4,
        alignItems: "center",
    },
    filterText: {
        fontSize: 14,
        fontWeight: "600",
    },
    patientsContainer: {
        flex: 1,
        padding: 16,
    },
    patientCard: {
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
    patientHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 12,
    },
    patientInfo: {
        flex: 1,
    },
    patientName: {
        fontSize: 18,
        fontWeight: "600",
    },
    patientMeta: {
        marginTop: 4,
    },
    patientMetaText: {
        fontSize: 14,
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
    patientDetails: {
        borderTopWidth: 1,
        borderTopColor: "#E5E5E5",
        paddingTop: 12,
    },
    detailRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
    },
    detailText: {
        marginLeft: 8,
        fontSize: 14,
    },
    emptyState: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
        borderRadius: 20,
        marginTop: 20,
    },
    emptyStateText: {
        fontSize: 16,
        marginTop: 12,
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
});
