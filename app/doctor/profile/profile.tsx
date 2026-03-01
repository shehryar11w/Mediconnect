import { ThemedText } from "@/components/ThemedText";
import { useAuth } from "@/context/authContext";
import detailsService from "@/services/detailsService";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { useColorScheme } from "../../../hooks/useColorScheme";
import { createGlobalStyles } from "../../../theme/styles";

const ProfileScreen = () => {
    const { colors, isDark, setThemeMode } = useColorScheme();
    const globalStyles = createGlobalStyles(colors);
    const { currentUser } = useAuth();
    // State for settings
    const [baseRate, setBaseRate] = useState<number>(0);
    type WorkingDays = {
        monday: boolean;
        tuesday: boolean;
        wednesday: boolean;
        thursday: boolean;
        friday: boolean;
        saturday: boolean;
        sunday: boolean;
    };
    const [workingDays, setWorkingDays] = useState<WorkingDays>({
        monday: false,
        tuesday: false,
        wednesday: false,
        thursday: false,
        friday: false,
        saturday: false,
        sunday: false,
    });
    const [workingHours, setWorkingHours] = useState({
        start: "00:00",
        end: "00:00",
    });
    const [showTimeModal, setShowTimeModal] = useState(false);
    const [selectedTimeType, setSelectedTimeType] = useState<"start" | "end">(
        "start",
    );
    const [unavailableDates, setUnavailableDates] = useState<{
        [key: string]: {
            selected: boolean;
            selectedColor: string;
        };
    }>({});
    const [doctorDetails, setDoctorDetails] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    const handleDateSelect = (date: { dateString: string }) => {
        const dateString = date.dateString;
        setUnavailableDates((prev) => ({
            ...prev,
            [dateString]: {
                selected: !prev[dateString]?.selected,
                selectedColor: colors.doctorPrimary,
            },
        }));
    };

    const handleSave = async () => {
        console.log(baseRate);
        console.log(workingDays);
        console.log(workingHours);
        console.log(unavailableDates);
        const updatedData = {
            DoctorBaseRate: baseRate,
            DoctorWorkingDays: Object.entries(workingDays)
                .filter(([_, isSelected]) => isSelected)
                .map(([day]) => day),
            DoctorWorkingHours: workingHours,
            DoctorUnavailableDays: Object.keys(unavailableDates).filter(
                (day) =>
                    unavailableDates[day as keyof typeof unavailableDates]
                        .selected,
            ),
        };
        console.log(updatedData);
        const res = await detailsService.updateDoctorDetails(
            currentUser?.id,
            updatedData,
        );
        console.log(res);
    };

    useEffect(() => {
        const fetchDoctorDetails = async () => {
            try {
                setIsLoading(true);
                const res = await detailsService.getDoctorDetails(
                    currentUser?.id,
                );
                setDoctorDetails(res.data);
                setBaseRate(res.data.details.DoctorBaseRate);
                const workingDaysArray = res.data.details.DoctorWorkingDays;
                setWorkingDays({
                    monday: workingDaysArray.includes("monday"),
                    tuesday: workingDaysArray.includes("tuesday"),
                    wednesday: workingDaysArray.includes("wednesday"),
                    thursday: workingDaysArray.includes("thursday"),
                    friday: workingDaysArray.includes("friday"),
                    saturday: workingDaysArray.includes("saturday"),
                    sunday: workingDaysArray.includes("sunday"),
                });
                if (
                    res.data.details.DoctorWorkingHours[0].start &&
                    res.data.details.DoctorWorkingHours[0].end
                ) {
                    setWorkingHours({
                        start: res.data.details.DoctorWorkingHours[0].start,
                        end: res.data.details.DoctorWorkingHours[0].end,
                    });
                } else {
                    setWorkingHours({
                        start: "00:00",
                        end: "00:00",
                    });
                }
                if (res.data.details.DoctorUnavailableDays) {
                    const markedDates =
                        res.data.details.DoctorUnavailableDays.reduce(
                            (acc: any, date: string) => {
                                acc[date] = {
                                    selected: true,
                                    selectedColor: "#FF0000",
                                };
                                return acc;
                            },
                            {},
                        );
                    setUnavailableDates(markedDates);
                } else {
                    setUnavailableDates({});
                }
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

    // Add loading indicator
    if (isLoading) {
        return (
            <View
                style={[
                    styles.container,
                    { justifyContent: "center", alignItems: "center" },
                ]}
            >
                <ActivityIndicator size="large" color={colors.doctorPrimary} />
            </View>
        );
    }

    // Add error handling for missing doctor details
    if (!doctorDetails) {
        return (
            <View
                style={[
                    styles.container,
                    { justifyContent: "center", alignItems: "center" },
                ]}
            >
                <ThemedText style={styles.errorText}>
                    Failed to load profile details
                </ThemedText>
                <TouchableOpacity
                    style={[
                        styles.retryButton,
                        { backgroundColor: colors.doctorPrimary },
                    ]}
                    onPress={() => router.replace("/doctor/profile/profile")}
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
        );
    }

    const toggleTheme = () => {
        setThemeMode(isDark ? "light" : "dark");
    };

    const handleTimeSelect = (type: "start" | "end") => {
        setSelectedTimeType(type);
        setShowTimeModal(true);
    };

    const handleTimeChange = (event: any, selectedTime?: Date) => {
        if (selectedTime) {
            const hours = selectedTime.getHours().toString().padStart(2, "0");
            const minutes = selectedTime
                .getMinutes()
                .toString()
                .padStart(2, "0");
            const timeString = `${hours}:${minutes}`;

            setWorkingHours((prev) => ({
                ...prev,
                [selectedTimeType]: timeString,
            }));
        }
        if (Platform.OS === "android") {
            setShowTimeModal(false);
        }
    };

    const getTimeFromString = (timeString: string) => {
        const [hours, minutes] = timeString.split(":").map(Number);
        const date = new Date();
        date.setHours(hours);
        date.setMinutes(minutes);
        return date;
    };

    const renderInfoItem = (icon: string, label: string, value: string) => (
        <View style={[styles.infoItem, { backgroundColor: colors.background }]}>
            <View style={styles.infoIcon}>
                <Ionicons
                    name={icon as any}
                    size={24}
                    color={colors.doctorPrimary}
                />
            </View>
            <View style={styles.infoContent}>
                <ThemedText
                    style={[styles.infoLabel, { color: colors.textLight }]}
                >
                    {label}
                </ThemedText>
                <ThemedText style={styles.infoValue}>{value}</ThemedText>
            </View>
        </View>
    );

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
                        Profile
                    </ThemedText>
                    <View style={styles.headerRight}>
                        <TouchableOpacity
                            onPress={() => {
                                router.replace("/doctor/profile/profile");
                            }}
                        >
                            <Ionicons
                                name="refresh"
                                size={24}
                                color={colors.background}
                            />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => router.push("/doctor/profile/edit")}
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

            <View style={styles.content}>
                {/* Profile Header */}
                <View
                    style={[
                        styles.profileHeader,
                        { backgroundColor: colors.background },
                    ]}
                >
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
                            {doctorDetails.basicInfo.name
                                .charAt(4)
                                .toUpperCase()}
                        </ThemedText>
                    </View>
                    <ThemedText style={styles.name}>
                        {doctorDetails.basicInfo.name}
                    </ThemedText>
                    <ThemedText
                        style={[
                            styles.specialization,
                            { color: colors.textLight },
                        ]}
                    >
                        {doctorDetails.basicInfo.specialization}
                    </ThemedText>
                </View>

                {/* Practice Settings */}
                <View
                    style={[
                        styles.section,
                        { backgroundColor: colors.background },
                    ]}
                >
                    <View style={styles.sectionHeader}>
                        <ThemedText style={styles.sectionTitle}>
                            Practice Settings
                        </ThemedText>
                    </View>

                    {/* Base Rate */}
                    <View style={styles.settingItem}>
                        <View style={styles.settingInfo}>
                            <Ionicons
                                name="cash"
                                size={24}
                                color={colors.doctorPrimary}
                            />
                            <ThemedText style={styles.settingLabel}>
                                Base Rate (per hour)
                            </ThemedText>
                        </View>
                        <View style={styles.rateInput}>
                            <ThemedText
                                style={[
                                    styles.currency,
                                    { color: colors.textLight },
                                ]}
                            >
                                PKR
                            </ThemedText>
                            <TextInput
                                value={baseRate.toString()}
                                onChangeText={(text) =>
                                    setBaseRate(Number(text))
                                }
                                keyboardType="numeric"
                                style={[
                                    styles.input,
                                    {
                                        color: colors.text,
                                        borderColor: colors.border,
                                    },
                                ]}
                                placeholderTextColor={colors.textLight}
                            />
                        </View>
                    </View>

                    {/* Working Days */}
                    <View style={styles.settingItem}>
                        <View style={styles.settingInfo}>
                            <Ionicons
                                name="calendar-outline"
                                size={24}
                                color={colors.doctorPrimary}
                            />
                            <ThemedText style={styles.settingLabel}>
                                Working Days
                            </ThemedText>
                        </View>
                        <View style={styles.workingDaysContainer}>
                            {Object.entries(workingDays).map(
                                ([day, isSelected]) => (
                                    <TouchableOpacity
                                        key={day}
                                        style={[
                                            styles.dayButton,
                                            {
                                                backgroundColor: isSelected
                                                    ? colors.doctorPrimary
                                                    : colors.doctorPrimary +
                                                      "20",
                                            },
                                        ]}
                                        onPress={() =>
                                            setWorkingDays((prev) => ({
                                                ...prev,
                                                [day]: !prev[
                                                    day as keyof typeof prev
                                                ],
                                            }))
                                        }
                                    >
                                        <ThemedText
                                            style={[
                                                styles.dayText,
                                                {
                                                    color: isSelected
                                                        ? colors.background
                                                        : colors.doctorPrimary,
                                                },
                                            ]}
                                        >
                                            {day.charAt(0).toUpperCase() +
                                                day.slice(1, 3)}
                                        </ThemedText>
                                    </TouchableOpacity>
                                ),
                            )}
                        </View>
                    </View>

                    {/* Working Hours */}
                    <View style={styles.settingItem}>
                        <View style={styles.settingInfo}>
                            <Ionicons
                                name="time"
                                size={24}
                                color={colors.doctorPrimary}
                            />
                            <ThemedText style={styles.settingLabel}>
                                Working Hours
                            </ThemedText>
                        </View>
                        <View style={styles.timeContainer}>
                            <TouchableOpacity
                                style={[
                                    styles.timeButton,
                                    {
                                        backgroundColor:
                                            colors.doctorPrimary + "20",
                                    },
                                ]}
                                onPress={() => handleTimeSelect("start")}
                            >
                                <ThemedText
                                    style={[
                                        styles.timeText,
                                        { color: colors.doctorPrimary },
                                    ]}
                                >
                                    {workingHours.start}
                                </ThemedText>
                            </TouchableOpacity>
                            <ThemedText
                                style={[
                                    styles.timeSeparator,
                                    { color: colors.textLight },
                                ]}
                            >
                                to
                            </ThemedText>
                            <TouchableOpacity
                                style={[
                                    styles.timeButton,
                                    {
                                        backgroundColor:
                                            colors.doctorPrimary + "20",
                                    },
                                ]}
                                onPress={() => handleTimeSelect("end")}
                            >
                                <ThemedText
                                    style={[
                                        styles.timeText,
                                        { color: colors.doctorPrimary },
                                    ]}
                                >
                                    {workingHours.end}
                                </ThemedText>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Unavailable Dates */}
                    <View style={styles.settingItem}>
                        <View style={styles.settingInfo}>
                            <Ionicons
                                name="calendar"
                                size={24}
                                color={colors.doctorPrimary}
                            />
                            <ThemedText style={styles.settingLabel}>
                                Unavailable Dates
                            </ThemedText>
                        </View>
                        <Calendar
                            onDayPress={handleDateSelect}
                            markedDates={unavailableDates}
                            theme={{
                                backgroundColor: colors.background,
                                calendarBackground: colors.background,
                                textSectionTitleColor: colors.text,
                                selectedDayBackgroundColor:
                                    colors.doctorPrimary,
                                selectedDayTextColor: colors.background,
                                todayTextColor: colors.doctorPrimary,
                                dayTextColor: colors.text,
                                textDisabledColor: colors.textLight,
                                dotColor: colors.doctorPrimary,
                                monthTextColor: colors.text,
                                arrowColor: colors.doctorPrimary,
                            }}
                            style={styles.calendar}
                        />
                    </View>
                    <TouchableOpacity
                        style={[
                            styles.saveButton,
                            { backgroundColor: colors.doctorPrimary },
                        ]}
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

                {/* Theme Toggle */}
                <View
                    style={[
                        styles.section,
                        { backgroundColor: colors.background },
                    ]}
                >
                    <View style={styles.sectionHeader}>
                        <ThemedText style={styles.sectionTitle}>
                            Appearance
                        </ThemedText>
                    </View>
                    <View style={styles.themeToggle}>
                        <View style={styles.themeInfo}>
                            <Ionicons
                                name={isDark ? "moon" : "sunny"}
                                size={24}
                                color={colors.doctorPrimary}
                            />
                            <ThemedText style={styles.themeLabel}>
                                {isDark ? "Dark Mode" : "Light Mode"}
                            </ThemedText>
                        </View>
                        <Switch
                            value={isDark}
                            onValueChange={toggleTheme}
                            trackColor={{
                                false: colors.textLight,
                                true: colors.doctorPrimary,
                            }}
                        />
                    </View>
                </View>

                {/* Contact Information */}
                <View
                    style={[
                        styles.section,
                        { backgroundColor: colors.background },
                    ]}
                >
                    <View style={styles.sectionHeader}>
                        <ThemedText style={styles.sectionTitle}>
                            Contact Information
                        </ThemedText>
                    </View>
                    {renderInfoItem(
                        "mail",
                        "Email",
                        doctorDetails.basicInfo.email,
                    )}
                    {renderInfoItem(
                        "call",
                        "Phone",
                        doctorDetails.basicInfo.phone,
                    )}
                    {renderInfoItem(
                        "location",
                        "Address",
                        doctorDetails.details.DoctorAddress,
                    )}
                </View>

                {/* Education */}
                <View
                    style={[
                        styles.section,
                        { backgroundColor: colors.background },
                    ]}
                >
                    <View style={styles.sectionHeader}>
                        <ThemedText style={styles.sectionTitle}>
                            Education
                        </ThemedText>
                    </View>
                    {doctorDetails.details.DoctorEducation &&
                        doctorDetails.details.DoctorEducation.map(
                            (edu: any, index: number) => (
                                <View key={index} style={styles.educationItem}>
                                    <View style={styles.educationHeader}>
                                        <ThemedText style={styles.degree}>
                                            {edu.degree}
                                        </ThemedText>
                                        <ThemedText
                                            style={[
                                                styles.year,
                                                { color: colors.textLight },
                                            ]}
                                        >
                                            {edu.year}
                                        </ThemedText>
                                    </View>
                                    <ThemedText
                                        style={[
                                            styles.institution,
                                            { color: colors.textLight },
                                        ]}
                                    >
                                        {edu.institution}
                                    </ThemedText>
                                </View>
                            ),
                        )}
                </View>

                <TouchableOpacity
                    style={[
                        styles.logoutButton,
                        { backgroundColor: colors.doctorPrimary },
                    ]}
                    onPress={() =>
                        router.push("/startup/signin?userType=doctor" as any)
                    }
                >
                    <ThemedText
                        style={[
                            styles.logoutText,
                            { color: colors.background },
                        ]}
                    >
                        Logout
                    </ThemedText>
                    <Ionicons
                        name="log-out"
                        size={24}
                        color={colors.background}
                    />
                </TouchableOpacity>
            </View>

            {/* Time Selection Modal */}
            <Modal
                visible={showTimeModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowTimeModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View
                        style={[
                            styles.modalContent,
                            { backgroundColor: colors.background },
                        ]}
                    >
                        <ThemedText style={styles.modalTitle}>
                            Select{" "}
                            {selectedTimeType === "start" ? "Start" : "End"}{" "}
                            Time
                        </ThemedText>
                        <View style={styles.timePicker}>
                            {Platform.OS === "ios" ? (
                                <DateTimePicker
                                    value={getTimeFromString(
                                        selectedTimeType === "start"
                                            ? workingHours.start
                                            : workingHours.end,
                                    )}
                                    mode="time"
                                    display="spinner"
                                    accentColor="red"
                                    onChange={handleTimeChange}
                                    style={[
                                        styles.timePickerIOS,
                                        {
                                            backgroundColor:
                                                colors.doctorPrimary + "20",
                                            borderRadius: 10,
                                        },
                                    ]}
                                />
                            ) : (
                                <DateTimePicker
                                    value={getTimeFromString(
                                        selectedTimeType === "start"
                                            ? workingHours.start
                                            : workingHours.end,
                                    )}
                                    mode="time"
                                    display="spinner"
                                    accentColor="red"
                                    onChange={handleTimeChange}
                                    style={[
                                        styles.timePickerIOS,
                                        {
                                            backgroundColor:
                                                colors.background + "20",
                                            borderRadius: 10,
                                        },
                                    ]}
                                />
                            )}
                        </View>
                        {Platform.OS === "ios" && (
                            <View style={styles.modalActions}>
                                <TouchableOpacity
                                    style={[
                                        styles.modalButton,
                                        {
                                            backgroundColor:
                                                colors.doctorPrimary + "20",
                                        },
                                    ]}
                                    onPress={() => setShowTimeModal(false)}
                                >
                                    <ThemedText
                                        style={[
                                            styles.modalButtonText,
                                            { color: colors.doctorPrimary },
                                        ]}
                                    >
                                        Cancel
                                    </ThemedText>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[
                                        styles.modalButton,
                                        {
                                            backgroundColor:
                                                colors.doctorPrimary,
                                        },
                                    ]}
                                    onPress={() => setShowTimeModal(false)}
                                >
                                    <ThemedText
                                        style={[
                                            styles.modalButtonText,
                                            { color: colors.background },
                                        ]}
                                    >
                                        Confirm
                                    </ThemedText>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
};

export default ProfileScreen;

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
        gap: 12,
    },
    content: {
        flex: 1,
        padding: 16,
        gap: 16,
    },
    profileHeader: {
        alignItems: "center",
        padding: 24,
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
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 16,
    },
    avatarText: {
        fontSize: 30,
        fontWeight: "bold",
    },
    name: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 4,
    },
    specialization: {
        fontSize: 16,
    },
    section: {
        borderRadius: 20,
        padding: 16,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    sectionHeader: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "600",
    },
    settingItem: {
        marginBottom: 20,
    },
    settingInfo: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginBottom: 12,
    },
    settingLabel: {
        fontSize: 16,
        fontWeight: "500",
    },
    rateInput: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    input: {
        flex: 1,
        height: 40,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        fontSize: 16,
    },
    currency: {
        fontSize: 16,
        fontWeight: "600",
    },
    timeContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    timeButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    timeText: {
        fontSize: 16,
        fontWeight: "500",
    },
    timeSeparator: {
        fontSize: 16,
    },
    calendar: {
        borderRadius: 12,
        marginTop: 8,
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
        padding: 24,
        borderRadius: 16,
        gap: 16,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "bold",
    },
    timePicker: {
        alignItems: "center",
    },
    timePickerIOS: {
        width: "100%",
        height: 200,
    },
    modalActions: {
        flexDirection: "row",
        gap: 12,
        marginTop: 8,
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
    themeToggle: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    themeInfo: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    themeLabel: {
        fontSize: 16,
    },
    infoItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#E5E5E5",
    },
    infoIcon: {
        width: 40,
        alignItems: "center",
    },
    infoContent: {
        flex: 1,
        marginLeft: 12,
    },
    infoLabel: {
        fontSize: 14,
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 16,
    },
    educationItem: {
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#E5E5E5",
    },
    educationHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 4,
    },
    degree: {
        fontSize: 16,
        fontWeight: "600",
    },
    year: {
        fontSize: 14,
    },
    institution: {
        fontSize: 14,
    },
    logoutButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        borderRadius: 20,
        padding: 16,
        justifyContent: "center",
        marginTop: 8,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: "bold",
    },
    workingDaysContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginTop: 8,
    },
    dayButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        minWidth: 60,
        alignItems: "center",
    },
    dayText: {
        fontSize: 14,
        fontWeight: "500",
    },
    errorText: {
        fontSize: 16,
        marginBottom: 16,
        textAlign: "center",
    },
    retryButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryButtonText: {
        fontSize: 16,
        fontWeight: "600",
    },
    saveButton: {
        padding: 12,
        borderRadius: 8,
        alignItems: "center",
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: "600",
    },
});
