import { ThemedText } from "@/components/ThemedText";
import { useAuth } from "@/context/authContext";
import detailsService from "@/services/detailsService";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Switch,
    TouchableOpacity,
    View,
} from "react-native";
import { useColorScheme } from "../../../hooks/useColorScheme";
import { createGlobalStyles } from "../../../theme/styles";

const PatientProfileScreen = () => {
    const { colors, isDark, setThemeMode } = useColorScheme();
    const globalStyles = createGlobalStyles(colors);
    const { currentUser } = useAuth();
    const [patient, setPatient] = useState<any>(null);
    const toggleTheme = () => {
        setThemeMode(isDark ? "light" : "dark");
    };

    useEffect(() => {
        const fetchPatientDetails = async () => {
            const patientDetails = await detailsService.getPatientDetails(
                currentUser?.id,
            );
            console.log(patientDetails.data);
            setPatient(patientDetails.data);
        };
        fetchPatientDetails();
    }, [currentUser]);

    const renderMedicalRecord = (record: any) => (
        <View
            key={record}
            style={[styles.recordCard, { backgroundColor: colors.background }]}
        >
            <View style={styles.recordHeader}>
                <View style={styles.recordType}>
                    <ThemedText style={styles.recordName}>{record}</ThemedText>
                </View>
            </View>
        </View>
    );

    const handleLogout = async () => {
        await AsyncStorage.clear();
        router.push("/startup/signin?userType=patient" as any);
    };

    return (
        <ScrollView style={[globalStyles.container, styles.container]}>
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
                        Profile
                    </ThemedText>
                    <View style={styles.headerRight}>
                        <TouchableOpacity
                            onPress={() => {
                                router.replace("/patient/profile/profile");
                            }}
                        >
                            <Ionicons
                                name="refresh"
                                size={24}
                                color={colors.background}
                            />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => {
                                router.push("/patient/profile/edit");
                            }}
                        >
                            <Ionicons
                                name="create"
                                size={24}
                                color={colors.background}
                            />
                        </TouchableOpacity>
                    </View>
                </View>
            </LinearGradient>

            {/* Profile Info */}
            <View style={styles.profileSection}>
                <View style={styles.profileHeader}>
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
                            {patient?.basicInfo?.name.charAt(0)}
                        </ThemedText>
                    </View>
                    <View style={styles.profileInfo}>
                        <ThemedText style={styles.profileName}>
                            {patient?.basicInfo?.name}
                        </ThemedText>
                        <ThemedText
                            style={[
                                styles.profileDetails,
                                { color: colors.textLight },
                            ]}
                        >
                            {patient?.details?.PatientAge
                                ? patient?.details?.PatientAge + " years •"
                                : ""}{" "}
                            {patient?.details?.PatientGender}
                        </ThemedText>
                    </View>
                </View>

                <View
                    style={[
                        styles.infoCard,
                        { backgroundColor: colors.background },
                    ]}
                >
                    <View style={styles.infoRow}>
                        <View style={styles.infoItem}>
                            <ThemedText
                                style={[
                                    styles.infoLabel,
                                    { color: colors.textLight },
                                ]}
                            >
                                Blood Type
                            </ThemedText>
                            <ThemedText style={styles.infoValue}>
                                {patient?.details?.PatientBloodGroup}
                            </ThemedText>
                        </View>
                        <View style={styles.infoItem}>
                            <ThemedText
                                style={[
                                    styles.infoLabel,
                                    { color: colors.textLight },
                                ]}
                            >
                                Height
                            </ThemedText>
                            <ThemedText style={styles.infoValue}>
                                {patient?.details?.PatientHeight}
                            </ThemedText>
                        </View>
                        <View style={styles.infoItem}>
                            <ThemedText
                                style={[
                                    styles.infoLabel,
                                    { color: colors.textLight },
                                ]}
                            >
                                Weight
                            </ThemedText>
                            <ThemedText style={styles.infoValue}>
                                {patient?.details?.PatientWeight}
                            </ThemedText>
                        </View>
                    </View>
                </View>
            </View>

            {/* Contact Information */}
            <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>
                    Contact Information
                </ThemedText>
                {patient?.basicInfo?.email || patient?.basicInfo?.phone ? (
                    <View
                        style={[
                            styles.contactCard,
                            { backgroundColor: colors.background },
                        ]}
                    >
                        <View style={styles.contactItem}>
                            <Ionicons
                                name="mail"
                                size={20}
                                color={colors.patientPrimary}
                            />
                            <ThemedText style={styles.contactText}>
                                {patient?.basicInfo?.email}
                            </ThemedText>
                        </View>
                        <View style={styles.contactItem}>
                            <Ionicons
                                name="call"
                                size={20}
                                color={colors.patientPrimary}
                            />
                            <ThemedText style={styles.contactText}>
                                {patient?.basicInfo?.phone}
                            </ThemedText>
                        </View>
                    </View>
                ) : (
                    <ThemedText
                        style={[
                            styles.statusText,
                            { color: colors.textLight, fontSize: 16 },
                        ]}
                    >
                        No contact information found
                    </ThemedText>
                )}
            </View>

            {/* Emergency Contact */}
            <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>
                    Emergency Contact
                </ThemedText>
                {(() => {
                    const contacts = (
                        patient?.details?.PatientEmergencyContact || []
                    ).filter(
                        (c: any) =>
                            (c?.name && c.name.trim() !== "") ||
                            (c?.phoneNumber && c.phoneNumber.trim() !== ""),
                    );
                    if (contacts.length > 0) {
                        const contact = contacts[0];
                        return (
                            <View
                                style={[
                                    styles.contactCard,
                                    {
                                        backgroundColor: colors.background,
                                        marginBottom: 20,
                                    },
                                ]}
                            >
                                {contact?.name &&
                                    contact.name.trim() !== "" && (
                                        <View style={styles.contactItem}>
                                            <Ionicons
                                                name="person"
                                                size={20}
                                                color={colors.patientPrimary}
                                            />
                                            <ThemedText
                                                style={styles.contactText}
                                            >
                                                {contact.name}
                                            </ThemedText>
                                        </View>
                                    )}
                                {contact?.phoneNumber &&
                                    contact.phoneNumber.trim() !== "" && (
                                        <View style={styles.contactItem}>
                                            <Ionicons
                                                name="call"
                                                size={20}
                                                color={colors.patientPrimary}
                                            />
                                            <ThemedText
                                                style={styles.contactText}
                                            >
                                                {contact.phoneNumber}
                                            </ThemedText>
                                        </View>
                                    )}
                            </View>
                        );
                    } else {
                        return (
                            <View
                                style={[
                                    styles.section,
                                    {
                                        alignItems: "center",
                                        justifyContent: "center",
                                        flex: 1,
                                    },
                                ]}
                            >
                                <ThemedText
                                    style={[
                                        styles.statusText,
                                        {
                                            color: colors.textLight,
                                            fontSize: 16,
                                            fontWeight: "400",
                                        },
                                    ]}
                                >
                                    No emergency contact found
                                </ThemedText>
                            </View>
                        );
                    }
                })()}
            </View>

            {/* Medical Records */}
            <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>
                    Medical Records
                </ThemedText>
                {patient?.details?.PatientMedicalRecord.length > 0 ? (
                    patient?.details?.PatientMedicalRecord.map((record: any) =>
                        renderMedicalRecord(record),
                    )
                ) : (
                    <View
                        style={[
                            styles.section,
                            {
                                alignItems: "center",
                                justifyContent: "center",
                                flex: 1,
                            },
                        ]}
                    >
                        <ThemedText
                            style={[
                                styles.statusText,
                                {
                                    color: colors.textLight,
                                    fontSize: 16,
                                    fontWeight: "400",
                                },
                            ]}
                        >
                            No medical records found
                        </ThemedText>
                    </View>
                )}
            </View>

            {/* Settings */}
            <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>Appearance</ThemedText>
                <View
                    style={[
                        styles.settingsCard,
                        { backgroundColor: colors.background },
                    ]}
                >
                    <View style={styles.settingItem}>
                        <View style={styles.settingInfo}>
                            <Ionicons
                                name="moon"
                                size={24}
                                color={colors.patientPrimary}
                            />
                            <ThemedText style={styles.settingLabel}>
                                Dark Mode
                            </ThemedText>
                        </View>
                        <Switch
                            value={isDark}
                            onValueChange={toggleTheme}
                            trackColor={{
                                false: colors.textLight,
                                true: colors.patientPrimary,
                            }}
                        />
                    </View>
                </View>
            </View>

            {/* Logout Button */}
            <TouchableOpacity
                style={[
                    styles.logoutButton,
                    { backgroundColor: colors.patientPrimary },
                ]}
                onPress={handleLogout}
            >
                <Ionicons name="log-out" size={24} color={colors.background} />
                <ThemedText
                    style={[styles.logoutText, { color: colors.background }]}
                >
                    Logout
                </ThemedText>
            </TouchableOpacity>
        </ScrollView>
    );
};

export default PatientProfileScreen;

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
    headerRight: {
        flexDirection: "row",
        gap: 16,
    },
    profileSection: {
        padding: 20,
    },
    profileHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: "center",
        alignItems: "center",
    },
    avatarText: {
        fontSize: 32,
        fontWeight: "600",
    },
    profileInfo: {
        flex: 1,
    },
    profileName: {
        fontSize: 24,
        fontWeight: "600",
    },
    profileDetails: {
        fontSize: 16,
        marginTop: 4,
    },
    infoCard: {
        marginTop: 20,
        padding: 16,
        borderRadius: 16,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    infoRow: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    infoItem: {
        alignItems: "center",
    },
    infoLabel: {
        fontSize: 14,
        marginBottom: 4,
    },
    infoValue: {
        fontSize: 16,
        fontWeight: "600",
    },
    section: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: "600",
        marginBottom: 16,
    },
    contactCard: {
        padding: 16,
        borderRadius: 16,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    contactItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginBottom: 12,
    },
    contactText: {
        fontSize: 16,
    },
    recordCard: {
        padding: 16,
        borderRadius: 16,
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
    recordHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    recordType: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    recordName: {
        fontSize: 16,
        fontWeight: "600",
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: "600",
    },
    recordDate: {
        fontSize: 14,
        marginBottom: 4,
    },
    recordDescription: {
        fontSize: 14,
    },
    settingsCard: {
        padding: 16,
        borderRadius: 16,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    settingItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 12,
    },
    settingInfo: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    settingLabel: {
        fontSize: 16,
    },
    logoutButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        margin: 20,
        padding: 16,
        borderRadius: 12,
        gap: 8,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: "600",
    },
});
