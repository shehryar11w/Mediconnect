import { ThemedText } from "@/components/ThemedText";
import detailsService from "@/services/detailsService";
import { notesService } from "@/services/NotesService";
import { prescriptionService } from "@/services/prescriptionService";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import { useColorScheme } from "../../../hooks/useColorScheme";
import { createGlobalStyles } from "../../../theme/styles";
type Patient = {
    id: string;
    name: string;
    age: number;
    gender: string;
    conditions: string[];
    lastVisit: string;
    nextAppointment?: string;
    status: "Active" | "Inactive";
    bloodGroup: string;
    allergies: string[];
    medications: string[];
    notes: string[];
};

const PatientScreen = () => {
    const { colors } = useColorScheme();
    const globalStyles = createGlobalStyles(colors);
    const { id } = useLocalSearchParams<{ id: string }>();
    const [patient, setPatient] = useState<Patient | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchPatient = useCallback(async () => {
        try {
            setIsLoading(true);
            console.log(id);
            const details = await detailsService.getPatientDetails(
                parseInt(id as string),
            );
            const medications =
                await prescriptionService.DoctorGetAllPrescriptions(
                    parseInt(id as string),
                );
            const notes = await notesService.getNotes(parseInt(id as string));
            if (details.success) {
                const patientData = details.data;
                setPatient({
                    id: patientData.id,
                    name: patientData.basicInfo.name,
                    age: patientData.details.PatientAge,
                    gender: patientData.details.PatientGender,
                    conditions: patientData.details.PatientMedicalRecord || [],
                    lastVisit:
                        patientData.details.PatientLastVisit ||
                        "No previous visits",
                    nextAppointment: patientData.details.PatientNextAppointment,
                    status: "Active",
                    bloodGroup:
                        patientData.details.PatientBloodGroup ||
                        "Not specified",
                    allergies: patientData.details.PatientAllergies || [],
                    medications:
                        medications.data.map(
                            (medication: any) =>
                                medication.PrescriptionMedicine,
                        ) || [],
                    notes:
                        notes.data.map((note: any) => note.NoteContent) || [],
                });
            } else {
                Alert.alert("Error", "Failed to fetch patient details");
            }
        } catch (error) {
            console.error("Error fetching patient details:", error);
            Alert.alert("Error", "Failed to fetch patient details");
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchPatient();
    }, [fetchPatient]);

    const renderQuickAction = (
        icon: string,
        label: string,
        onPress: () => void,
    ) => (
        <TouchableOpacity
            style={[styles.quickAction, { backgroundColor: colors.background }]}
            onPress={onPress}
        >
            <View
                style={[
                    styles.quickActionIcon,
                    { backgroundColor: colors.doctorPrimary + "20" },
                ]}
            >
                <Ionicons
                    name={icon as any}
                    size={24}
                    color={colors.doctorPrimary}
                />
            </View>
            <ThemedText style={styles.quickActionLabel}>{label}</ThemedText>
        </TouchableOpacity>
    );

    if (isLoading) {
        return (
            <View
                style={[
                    globalStyles.container,
                    styles.container,
                    styles.loadingContainer,
                ]}
            >
                <ThemedText>Loading patient details...</ThemedText>
            </View>
        );
    }

    if (!patient) {
        return (
            <View
                style={[
                    globalStyles.container,
                    styles.container,
                    styles.loadingContainer,
                ]}
            >
                <ThemedText>Patient not found</ThemedText>
            </View>
        );
    }

    return (
        <View style={[globalStyles.container, styles.container]}>
            {/* Header with Gradient */}
            <LinearGradient
                colors={[colors.doctorPrimary, colors.doctorPrimary + "CC"]}
                style={styles.headerGradient}
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()}>
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
                        Patient Details
                    </ThemedText>
                </View>
            </LinearGradient>

            <ScrollView style={styles.content}>
                {/* Patient Info Card */}
                <View
                    style={[
                        styles.card,
                        { backgroundColor: colors.background },
                    ]}
                >
                    <View style={styles.patientHeader}>
                        <View style={styles.patientInfo}>
                            <ThemedText style={styles.patientName}>
                                {patient.name}
                            </ThemedText>
                            <ThemedText
                                style={[
                                    styles.patientMeta,
                                    { color: colors.textLight },
                                ]}
                            >
                                {patient.age} years • {patient.gender} •{" "}
                                {patient.bloodGroup}
                            </ThemedText>
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
                </View>

                {/* Quick Actions */}
                <View style={styles.quickActions}>
                    {renderQuickAction("medical", "Prescriptions", () =>
                        router.push(`/doctor/patient/${id}/prescriptions`),
                    )}
                    {renderQuickAction("document-text", "Notes", () =>
                        router.push(`/doctor/patient/${id}/notes`),
                    )}
                    {renderQuickAction("analytics", "Reports", () =>
                        router.push(`/doctor/patient/${id}/reports`),
                    )}
                </View>

                {/* Medical History */}
                <View
                    style={[
                        styles.card,
                        { backgroundColor: colors.background },
                    ]}
                >
                    <ThemedText style={styles.sectionTitle}>
                        Medical History
                    </ThemedText>

                    <View style={styles.section}>
                        <ThemedText
                            style={[
                                styles.sectionLabel,
                                { color: colors.textLight },
                            ]}
                        >
                            Current Conditions
                        </ThemedText>
                        <View style={styles.conditionsList}>
                            {patient.conditions.length > 0 ? (
                                patient.conditions.map((condition, index) => (
                                    <View
                                        key={index}
                                        style={styles.conditionItem}
                                    >
                                        <Ionicons
                                            name="medical"
                                            size={16}
                                            color={colors.textLight}
                                        />
                                        <ThemedText
                                            style={[
                                                styles.conditionText,
                                                { color: colors.textLight },
                                            ]}
                                        >
                                            {condition}
                                        </ThemedText>
                                    </View>
                                ))
                            ) : (
                                <ThemedText
                                    style={[
                                        styles.emptyText,
                                        { color: colors.textLight },
                                    ]}
                                >
                                    No conditions recorded
                                </ThemedText>
                            )}
                        </View>
                    </View>

                    <View style={styles.section}>
                        <ThemedText
                            style={[
                                styles.sectionLabel,
                                { color: colors.textLight },
                            ]}
                        >
                            Current Medications
                        </ThemedText>
                        <View style={styles.medicationList}>
                            {patient.medications.length > 0 ? (
                                patient.medications.map((medication, index) => (
                                    <View
                                        key={index}
                                        style={styles.medicationItem}
                                    >
                                        <Ionicons
                                            name="medical"
                                            size={16}
                                            color={colors.textLight}
                                        />
                                        <ThemedText
                                            style={[
                                                styles.medicationText,
                                                { color: colors.textLight },
                                            ]}
                                        >
                                            {medication}
                                        </ThemedText>
                                    </View>
                                ))
                            ) : (
                                <ThemedText
                                    style={[
                                        styles.emptyText,
                                        { color: colors.textLight },
                                    ]}
                                >
                                    No medications prescribed
                                </ThemedText>
                            )}
                        </View>
                    </View>

                    <View style={styles.section}>
                        <ThemedText
                            style={[
                                styles.sectionLabel,
                                { color: colors.textLight },
                            ]}
                        >
                            Recent Notes
                        </ThemedText>
                        <View style={styles.notesList}>
                            {patient.notes.length > 0 ? (
                                patient.notes.map((note, index) => (
                                    <View key={index} style={styles.noteItem}>
                                        <Ionicons
                                            name="document-text"
                                            size={16}
                                            color={colors.textLight}
                                        />
                                        <ThemedText
                                            style={[
                                                styles.noteText,
                                                { color: colors.textLight },
                                            ]}
                                        >
                                            {note}
                                        </ThemedText>
                                    </View>
                                ))
                            ) : (
                                <ThemedText
                                    style={[
                                        styles.emptyText,
                                        { color: colors.textLight },
                                    ]}
                                >
                                    No notes available
                                </ThemedText>
                            )}
                        </View>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
};

export default PatientScreen;

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
        width: "100%",
    },

    headerTitle: {
        fontSize: 24,
        fontWeight: "bold",
        textAlign: "center",
        width: "100%",
    },
    content: {
        flex: 1,
        padding: 16,
    },
    card: {
        borderRadius: 20,
        padding: 16,
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
    patientHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 16,
    },
    patientInfo: {
        flex: 1,
    },
    patientName: {
        fontSize: 24,
        fontWeight: "bold",
    },
    patientMeta: {
        fontSize: 16,
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
    infoGrid: {
        flexDirection: "row",
        justifyContent: "space-between",
        borderTopWidth: 1,
        borderTopColor: "#E5E5E5",
        paddingTop: 16,
    },
    infoItem: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 14,
        marginBottom: 4,
    },
    infoValue: {
        fontSize: 16,
        fontWeight: "600",
    },
    quickActions: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        marginBottom: 16,
    },
    quickAction: {
        width: "48%",
        padding: 16,
        borderRadius: 20,
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
    quickActionIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 12,
    },
    quickActionLabel: {
        fontSize: 16,
        fontWeight: "600",
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 16,
    },
    section: {
        marginBottom: 20,
    },
    sectionLabel: {
        fontSize: 16,
        marginBottom: 8,
    },
    sectionValue: {
        fontSize: 16,
    },
    tags: {
        flexDirection: "row",
        flexWrap: "wrap",
    },
    tag: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginRight: 8,
        marginBottom: 8,
    },
    tagText: {
        fontSize: 14,
        fontWeight: "500",
    },
    medicationList: {
        gap: 8,
    },
    medicationItem: {
        flexDirection: "row",
        alignItems: "center",
    },
    medicationText: {
        marginLeft: 8,
        fontSize: 16,
    },
    notesList: {
        gap: 8,
    },
    noteItem: {
        flexDirection: "row",
        alignItems: "flex-start",
    },
    noteText: {
        marginLeft: 8,
        fontSize: 16,
        flex: 1,
    },
    loadingContainer: {
        justifyContent: "center",
        alignItems: "center",
    },
    emptyText: {
        fontSize: 14,
        fontStyle: "italic",
    },
    conditionsList: {
        gap: 8,
    },
    conditionItem: {
        flexDirection: "row",
        alignItems: "center",
    },
    conditionText: {
        marginLeft: 8,
        fontSize: 16,
    },
});
