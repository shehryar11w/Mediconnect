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

type DoctorProfile = {
    id: string;
    name: string;
    specialization: string;
    email: string;
    phone: string;
    address: string;
    education: {
        degree: string;
        institution: string;
        year: string;
    }[];
};

const EditProfileScreen = () => {
    const { colors } = useColorScheme();
    const { currentUser } = useAuth();
    const globalStyles = createGlobalStyles(colors);
    const [isLoading, setIsLoading] = useState(false);
    const [profile, setProfile] = useState<DoctorProfile>({
        id: "",
        name: "",
        specialization: "",
        email: "",
        phone: "",
        address: "",
        education: [],
    });

    useEffect(() => {
        const fetchDoctorDetails = async () => {
            try {
                setIsLoading(true);
                const res = await detailsService.getDoctorDetails(
                    currentUser?.id,
                );
                setProfile({
                    id: res.data.id,
                    name: res.data.basicInfo.name,
                    specialization: res.data.basicInfo.specialization,
                    email: res.data.basicInfo.email,
                    phone: res.data.basicInfo.phone,
                    address: res.data.details.DoctorAddress,
                    education: res.data.details.DoctorEducation || [],
                });
            } catch (error) {
                console.error("Error fetching doctor details:", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (currentUser?.id) {
            fetchDoctorDetails();
        }
    }, [currentUser?.id]);

    const handleSave = async () => {
        try {
            // Validate required fields
            if (!profile.name?.trim()) {
                Alert.alert("Error", "Name is required");
                return;
            }

            if (!profile.email?.trim()) {
                Alert.alert("Error", "Email is required");
                return;
            }

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(profile.email)) {
                Alert.alert("Error", "Please enter a valid email address");
                return;
            }

            // Validate phone number
            if (!profile.phone?.trim()) {
                Alert.alert("Error", "Phone number is required");
                return;
            }

            const phoneRegex = /^\+?[0-9]{10,14}$/;
            if (!phoneRegex.test(profile.phone.replace(/\s/g, ""))) {
                Alert.alert("Error", "Please enter a valid phone number");
                return;
            }

            // Validate specialization
            if (!profile.specialization?.trim()) {
                Alert.alert("Error", "Specialization is required");
                return;
            }

            // Validate education entries
            if (profile.education.length > 0) {
                for (let i = 0; i < profile.education.length; i++) {
                    const edu = profile.education[i];
                    if (
                        !edu.degree?.trim() ||
                        !edu.institution?.trim() ||
                        !edu.year?.trim()
                    ) {
                        Alert.alert(
                            "Error",
                            `Please complete all fields for education entry ${i + 1}`,
                        );
                        return;
                    }

                    // Validate year format
                    const yearRegex = /^\d{4}$/;
                    if (!yearRegex.test(edu.year)) {
                        Alert.alert(
                            "Error",
                            `Please enter a valid year for education entry ${i + 1}`,
                        );
                        return;
                    }
                }
            }

            setIsLoading(true);
            const updatedData = {
                DoctorName: profile.name.trim(),
                DoctorEmail: profile.email.trim(),
                DoctorPhone: profile.phone.trim(),
                DoctorAddress: profile.address?.trim() || "",
                DoctorSpecialization: profile.specialization.trim(),
                DoctorEducation: profile.education,
            };

            await detailsService.updateDoctorDetails(
                currentUser?.id,
                updatedData,
            );
            router.back();
        } catch (error) {
            console.error("Error updating profile:", error);
            Alert.alert("Error", "Failed to update profile. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const addEducation = () => {
        setProfile({
            ...profile,
            education: [
                ...profile.education,
                { degree: "", institution: "", year: "" },
            ],
        });
    };

    const removeEducation = (index: number) => {
        const newEducation = [...profile.education];
        newEducation.splice(index, 1);
        setProfile({
            ...profile,
            education: newEducation,
        });
    };

    const updateEducation = (
        index: number,
        field: keyof DoctorProfile["education"][0],
        value: string,
    ) => {
        const newEducation = [...profile.education];
        newEducation[index] = {
            ...newEducation[index],
            [field]: value,
        };
        setProfile({
            ...profile,
            education: newEducation,
        });
    };

    return (
        <ScrollView style={[globalStyles.container, styles.container]}>
            {/* Header with Gradient */}
            <LinearGradient
                colors={[colors.doctorPrimary, colors.doctorPrimary + "CC"]}
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
                        style={styles.saveButton}
                        onPress={handleSave}
                    >
                        <ThemedText
                            style={[
                                styles.saveButtonText,
                                { color: colors.background },
                            ]}
                        >
                            Save
                        </ThemedText>
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            {/* Profile Image */}
            <View style={styles.section}>
                <View style={styles.avatarContainer}>
                    <View
                        style={[
                            styles.avatar,
                            { backgroundColor: colors.doctorPrimary + "20" },
                        ]}
                    >
                        <ThemedText
                            style={[
                                styles.avatarText,
                                { color: colors.doctorPrimary },
                            ]}
                        >
                            {profile.name.charAt(0)}
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
                        value={profile.name}
                        onChangeText={(text) =>
                            setProfile({ ...profile, name: text })
                        }
                    />
                    <TextInput
                        style={[styles.input, { color: colors.text }]}
                        placeholder="Phone"
                        placeholderTextColor={colors.textLight}
                        value={profile.phone}
                        onChangeText={(text) =>
                            setProfile({ ...profile, phone: text })
                        }
                        keyboardType="phone-pad"
                    />
                    <TextInput
                        style={[styles.input, { color: colors.text }]}
                        placeholder="Address"
                        placeholderTextColor={colors.textLight}
                        value={profile.address}
                        onChangeText={(text) =>
                            setProfile({ ...profile, address: text })
                        }
                    />
                </View>
            </View>

            {/* Professional Information */}
            <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>
                    Professional Information
                </ThemedText>
                <View
                    style={[
                        styles.inputContainer,
                        { backgroundColor: colors.background },
                    ]}
                >
                    <TextInput
                        style={[styles.input, { color: colors.text }]}
                        placeholder="Specialization"
                        placeholderTextColor={colors.textLight}
                        value={profile.specialization}
                        onChangeText={(text) =>
                            setProfile({ ...profile, specialization: text })
                        }
                    />
                </View>
            </View>

            {/* Education */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <ThemedText style={styles.sectionTitle}>
                        Education
                    </ThemedText>
                    <TouchableOpacity
                        style={[
                            styles.addButton,
                            { backgroundColor: colors.doctorPrimary },
                        ]}
                        onPress={addEducation}
                    >
                        <Ionicons
                            name="add"
                            size={24}
                            color={colors.background}
                        />
                    </TouchableOpacity>
                </View>
                {profile.education.map((edu, index) => (
                    <View
                        key={index}
                        style={[
                            styles.educationContainer,
                            { backgroundColor: colors.background },
                        ]}
                    >
                        <View style={styles.educationHeader}>
                            <ThemedText style={styles.educationTitle}>
                                Education {index + 1}
                            </ThemedText>
                            <TouchableOpacity
                                onPress={() => removeEducation(index)}
                                style={styles.removeButton}
                            >
                                <Ionicons
                                    name="close-circle"
                                    size={24}
                                    color={colors.error}
                                />
                            </TouchableOpacity>
                        </View>
                        <TextInput
                            style={[styles.input, { color: colors.text }]}
                            placeholder="Degree"
                            placeholderTextColor={colors.textLight}
                            value={edu.degree}
                            onChangeText={(text) =>
                                updateEducation(index, "degree", text)
                            }
                        />
                        <TextInput
                            style={[styles.input, { color: colors.text }]}
                            placeholder="Institution"
                            placeholderTextColor={colors.textLight}
                            value={edu.institution}
                            onChangeText={(text) =>
                                updateEducation(index, "institution", text)
                            }
                        />
                        <TextInput
                            style={[styles.input, { color: colors.text }]}
                            placeholder="Year"
                            placeholderTextColor={colors.textLight}
                            value={edu.year}
                            onChangeText={(text) =>
                                updateEducation(index, "year", text)
                            }
                        />
                    </View>
                ))}
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
    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: "600",
    },
    addButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
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
    bioInput: {
        height: 100,
        textAlignVertical: "top",
        borderBottomWidth: 0,
    },
    educationContainer: {
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
    educationHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    educationTitle: {
        fontSize: 16,
        fontWeight: "600",
    },
    removeButton: {
        padding: 4,
    },
});
