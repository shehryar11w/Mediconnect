import { ThemedText } from "@/components/ThemedText";
import { useAuth } from "@/context/authContext";
import detailsService from "@/services/detailsService";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useColorScheme } from "../../../hooks/useColorScheme";
import { createGlobalStyles } from "../../../theme/styles";

const EditProfileScreen = () => {
    const { colors } = useColorScheme();
    const { currentUser } = useAuth();
    const globalStyles = createGlobalStyles(colors);
    const [profile, setProfile] = useState<any>();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchPatientDetails = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const patientDetails = await detailsService.getPatientDetails(
                    currentUser?.id,
                );
                console.log("patientDetails", patientDetails.data);
                if (patientDetails?.data) {
                    setProfile({
                        name: patientDetails.data.basicInfo.name,
                        email: patientDetails.data.basicInfo.email,
                        phone: patientDetails.data.basicInfo.phone,
                        age: patientDetails.data.details.PatientAge,
                        gender: patientDetails.data.details.PatientGender,
                        bloodGroup:
                            patientDetails.data.details.PatientBloodGroup,
                        emergencyContactName:
                            patientDetails.data.details
                                .PatientEmergencyContact[0]?.name || "",
                        emergencyContactPhone:
                            patientDetails.data.details
                                .PatientEmergencyContact[0]?.phoneNumber || "",
                        medicalRecord:
                            patientDetails.data.details.PatientMedicalRecord,
                        height: patientDetails.data.details.PatientHeight,
                        weight: patientDetails.data.details.PatientWeight,
                    });
                }
            } catch (error: any) {
                console.error("Error fetching patient details:", error);
                setError(
                    error?.response?.data?.message ||
                        "Failed to fetch patient details",
                );
                Alert.alert(
                    "Error",
                    error?.response?.data?.message ||
                        "Failed to fetch patient details",
                    [{ text: "OK" }],
                );
            } finally {
                setIsLoading(false);
            }
        };
        fetchPatientDetails();
    }, [currentUser]);

    const handleSave = async () => {
        if (!profile) return;

        // Validate required fields
        if (!profile.name?.trim()) {
            setError("Name is required");
            return;
        }

        if (!profile.email?.trim()) {
            setError("Email is required");
            return;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(profile.email)) {
            setError("Invalid email format");
            return;
        }

        // Validate phone number
        const phoneRegex = /^\+?[1-9]\d{9,14}$/;
        if (profile.phone && !phoneRegex.test(profile.phone)) {
            setError("Invalid phone number format");
            return;
        }

        // Validate age
        if (
            profile.age &&
            (isNaN(profile.age) || profile.age < 0 || profile.age > 120)
        ) {
            setError("Invalid age");
            return;
        }

        // Validate height and weight
        if (profile.height && (isNaN(profile.height) || profile.height <= 0)) {
            setError("Invalid height");
            return;
        }

        if (profile.weight && (isNaN(profile.weight) || profile.weight <= 0)) {
            setError("Invalid weight");
            return;
        }

        // Validate emergency contact
        if (profile.emergencyContactName && !profile.emergencyContactPhone) {
            setError("Emergency contact phone is required if name is provided");
            return;
        }

        if (
            profile.emergencyContactPhone &&
            !phoneRegex.test(profile.emergencyContactPhone)
        ) {
            setError("Invalid emergency contact phone number");
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            const updatedProfile = await detailsService.updatePatientDetails(
                currentUser?.id,
                {
                    PatientName: profile.name.trim(),
                    PatientEmail: profile.email.trim(),
                    PatientPhone: profile.phone,
                    PatientAge: profile.age,
                    PatientGender: profile.gender.trim(),
                    PatientBloodGroup: profile.bloodGroup,
                    PatientHeight: profile.height,
                    PatientWeight: profile.weight,
                    PatientEmergencyContact: [
                        {
                            name: profile.emergencyContactName,
                            phoneNumber: profile.emergencyContactPhone,
                        },
                    ],
                    PatientMedicalRecord: profile.medicalRecord,
                },
            );

            console.log("updatedProfile", updatedProfile);
            router.back();
        } catch (error: any) {
            console.log("Error updating profile:", error);
            setError(
                error?.response?.data?.message || "Failed to update profile",
            );
            Alert.alert(
                "Error",
                error?.response?.data?.message || "Failed to update profile",
                [{ text: "OK" }],
            );
        } finally {
            setIsLoading(false);
        }
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
                        Edit Profile
                    </ThemedText>
                    <TouchableOpacity
                        style={[
                            styles.saveButton,
                            isLoading && styles.disabledButton,
                        ]}
                        onPress={handleSave}
                        disabled={isLoading}
                    >
                        <ThemedText
                            style={[
                                styles.saveButtonText,
                                { color: colors.background },
                            ]}
                        >
                            {isLoading ? "Saving..." : "Save"}
                        </ThemedText>
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            {/* Error Message */}
            {error && (
                <View
                    style={[
                        styles.errorContainer,
                        { backgroundColor: colors.error + "20" },
                    ]}
                >
                    <Ionicons
                        name="alert-circle"
                        size={24}
                        color={colors.error}
                    />
                    <ThemedText
                        style={[styles.errorText, { color: colors.error }]}
                    >
                        {error}
                    </ThemedText>
                </View>
            )}

            {/* Profile Image */}
            <View style={styles.section}>
                <View style={styles.avatarContainer}>
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
                            {profile?.name?.charAt(0)}
                        </ThemedText>
                    </View>
                </View>
            </View>

            {/* Personal Information */}
            <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>
                    Personal Information
                </ThemedText>
                <View
                    style={[
                        styles.inputContainer,
                        { backgroundColor: colors.background },
                    ]}
                >
                    <TextInput
                        style={[styles.input, { color: colors.text }]}
                        placeholder="Full Name"
                        placeholderTextColor={colors.textLight}
                        value={profile?.name ? profile?.name : ""}
                        onChangeText={(text) =>
                            setProfile({ ...profile, name: text })
                        }
                    />
                    <TextInput
                        style={[styles.input, { color: colors.text }]}
                        placeholder="Phone"
                        placeholderTextColor={colors.textLight}
                        value={profile?.phone ? profile?.phone : ""}
                        onChangeText={(text) =>
                            setProfile({ ...profile, phone: text })
                        }
                        keyboardType="phone-pad"
                    />
                    <TextInput
                        style={[styles.input, { color: colors.text }]}
                        placeholder="Age"
                        placeholderTextColor={colors.textLight}
                        value={profile?.age ? profile?.age.toString() : ""}
                        onChangeText={(text) =>
                            setProfile({ ...profile, age: text })
                        }
                        keyboardType="numeric"
                    />
                    <TextInput
                        style={[styles.input, { color: colors.text }]}
                        placeholder="Gender"
                        placeholderTextColor={colors.textLight}
                        value={profile?.gender ? profile?.gender : ""}
                        onChangeText={(text) =>
                            setProfile({ ...profile, gender: text })
                        }
                    />
                    <TextInput
                        style={[styles.input, { color: colors.text }]}
                        placeholder="Blood Group"
                        placeholderTextColor={colors.textLight}
                        value={profile?.bloodGroup ? profile?.bloodGroup : ""}
                        onChangeText={(text) =>
                            setProfile({ ...profile, bloodGroup: text })
                        }
                    />
                    <TextInput
                        style={[styles.input, { color: colors.text }]}
                        placeholder="Height"
                        placeholderTextColor={colors.textLight}
                        value={
                            profile?.height ? profile?.height.toString() : ""
                        }
                        onChangeText={(text) =>
                            setProfile({ ...profile, height: text })
                        }
                        keyboardType="numeric"
                    />
                    <TextInput
                        style={[styles.input, { color: colors.text }]}
                        placeholder="Weight"
                        placeholderTextColor={colors.textLight}
                        value={
                            profile?.weight ? profile?.weight.toString() : ""
                        }
                        onChangeText={(text) =>
                            setProfile({ ...profile, weight: text })
                        }
                        keyboardType="numeric"
                    />
                </View>
            </View>

            {/* Emergency Contact */}
            <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>
                    Emergency Contact
                </ThemedText>
                <View
                    style={[
                        styles.inputContainer,
                        { backgroundColor: colors.background },
                    ]}
                >
                    <TextInput
                        style={[styles.input, { color: colors.text }]}
                        placeholder="Contact Name"
                        placeholderTextColor={colors.textLight}
                        value={
                            profile?.emergencyContactName
                                ? profile?.emergencyContactName
                                : ""
                        }
                        onChangeText={(text) =>
                            setProfile({
                                ...profile,
                                emergencyContactName: text,
                            })
                        }
                    />
                    <TextInput
                        style={[styles.input, { color: colors.text }]}
                        placeholder="Contact Phone"
                        placeholderTextColor={colors.textLight}
                        value={
                            profile?.emergencyContactPhone
                                ? profile?.emergencyContactPhone
                                : ""
                        }
                        onChangeText={(text) =>
                            setProfile({
                                ...profile,
                                emergencyContactPhone: text,
                            })
                        }
                        keyboardType="phone-pad"
                    />
                </View>
            </View>

            {/* Medical History */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <ThemedText style={styles.sectionTitle}>
                        Medical History
                    </ThemedText>
                    <TouchableOpacity
                        style={[
                            styles.addButton,
                            { backgroundColor: colors.patientPrimary },
                        ]}
                        onPress={() => {
                            setProfile({
                                ...profile,
                                medicalRecord: [...profile.medicalRecord, ""],
                            });
                        }}
                    >
                        <Ionicons
                            name="add"
                            size={24}
                            color={colors.background}
                        />
                    </TouchableOpacity>
                </View>
                <View
                    style={[
                        styles.inputContainer,
                        { backgroundColor: colors.background },
                    ]}
                >
                    {profile?.medicalRecord?.map(
                        (condition: string, index: number) => (
                            <View
                                key={`condition-${index}`}
                                style={styles.medicalItemContainer}
                            >
                                <TextInput
                                    style={[
                                        styles.input,
                                        styles.medicalInput,
                                        { color: colors.text },
                                    ]}
                                    placeholder="Medical Condition"
                                    placeholderTextColor={colors.textLight}
                                    value={condition}
                                    onChangeText={(text) => {
                                        const newConditions = [
                                            ...profile.medicalRecord,
                                        ];
                                        newConditions[index] = text;
                                        setProfile({
                                            ...profile,
                                            medicalRecord: newConditions,
                                        });
                                    }}
                                />
                                <TouchableOpacity
                                    style={styles.removeButton}
                                    onPress={() => {
                                        // Remove the selected condition and filter out any empty strings
                                        const newConditions =
                                            profile.medicalRecord
                                                .filter(
                                                    (_: string, i: number) =>
                                                        i !== index,
                                                )
                                                .filter(
                                                    (condition: string) =>
                                                        condition &&
                                                        condition.trim() !== "",
                                                );
                                        setProfile({
                                            ...profile,
                                            medicalRecord: newConditions,
                                        });
                                    }}
                                >
                                    <Ionicons
                                        name="close-circle"
                                        size={24}
                                        color={colors.error}
                                    />
                                </TouchableOpacity>
                            </View>
                        ),
                    )}
                </View>
            </View>
        </ScrollView>
    );
};

export default EditProfileScreen;

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
    saveButton: {
        padding: 8,
    },
    saveButtonText: {
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
    avatarContainer: {
        alignItems: "center",
        marginBottom: 20,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: "center",
        alignItems: "center",
    },
    avatarText: {
        fontSize: 40,
        fontWeight: "600",
    },
    changeAvatarButton: {
        position: "absolute",
        bottom: 0,
        right: "35%",
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    inputContainer: {
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
    input: {
        fontSize: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#E5E5E5",
        marginBottom: 16,
    },
    addressInput: {
        height: 80,
        textAlignVertical: "top",
        borderBottomWidth: 0,
    },
    medicalInput: {
        height: 60,
        textAlignVertical: "top",
        borderBottomWidth: 0,
    },
    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    addButton: {
        padding: 8,
    },
    medicalItemContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 16,
    },
    removeButton: {
        marginLeft: 8,
        padding: 4,
    },
    errorContainer: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        margin: 20,
        borderRadius: 8,
        gap: 8,
    },
    errorText: {
        flex: 1,
        fontSize: 14,
    },
    disabledButton: {
        opacity: 0.5,
    },
});
