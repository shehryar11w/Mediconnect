import { ThemedText } from "@/components/ThemedText";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { useColorScheme } from "../../hooks/useColorScheme";
import { createGlobalStyles } from "../../theme/styles";

type Notification = {
    id: string;
    title: string;
    message: string;
    type: "Appointment" | "Prescription" | "Report" | "System";
    date: string;
    isRead: boolean;
    action?: {
        type: "navigate" | "open";
        target: string;
    };
};

const NotificationsScreen = () => {
    const { colors } = useColorScheme();
    const globalStyles = createGlobalStyles(colors);
    const [selectedTab, setSelectedTab] = useState<"all" | "unread">("all");

    // Sample notifications data
    const notifications: Notification[] = [
        {
            id: "1",
            title: "Appointment Reminder",
            message:
                "Your appointment with Dr. Sarah Wilson is scheduled for tomorrow at 10:00 AM.",
            type: "Appointment",
            date: "2 hours ago",
            isRead: false,
            action: {
                type: "navigate",
                target: "appointments",
            },
        },
        {
            id: "2",
            title: "New Prescription",
            message:
                "Dr. Mike Johnson has prescribed new medication. Tap to view details.",
            type: "Prescription",
            date: "1 day ago",
            isRead: true,
            action: {
                type: "navigate",
                target: "prescriptions",
            },
        },
        {
            id: "3",
            title: "Lab Results Available",
            message:
                "Your recent blood test results are now available. Tap to view.",
            type: "Report",
            date: "2 days ago",
            isRead: true,
            action: {
                type: "navigate",
                target: "reports",
            },
        },
        {
            id: "4",
            title: "System Update",
            message:
                "New features have been added to the app. Check out the latest updates!",
            type: "System",
            date: "3 days ago",
            isRead: true,
        },
    ];

    const getTypeIcon = (type: Notification["type"]) => {
        switch (type) {
            case "Appointment":
                return "calendar";
            case "Prescription":
                return "medkit";
            case "Report":
                return "document-text";
            case "System":
                return "settings";
        }
    };

    const getTypeColor = (type: Notification["type"]) => {
        switch (type) {
            case "Appointment":
                return "#2196F3";
            case "Prescription":
                return "#4CAF50";
            case "Report":
                return "#FF9800";
            case "System":
                return "#9C27B0";
        }
    };

    const filteredNotifications = notifications.filter((notification) => {
        if (selectedTab === "all") return true;
        return !notification.isRead;
    });

    // const handleNotificationPress = (notification: Notification) => {
    //   if (notification.action) {
    //     if (notification.action.type === 'navigate') {
    //       router.push(notification.action.target);
    //     }
    //   }
    // };

    const renderNotification = (notification: Notification) => (
        <TouchableOpacity
            key={notification.id}
            style={[
                styles.notificationCard,
                { backgroundColor: colors.background },
                !notification.isRead && {
                    borderLeftColor: colors.patientPrimary,
                    borderLeftWidth: 4,
                },
            ]}
            // onPress={() => handleNotificationPress(notification)}
        >
            <View style={styles.notificationHeader}>
                <View
                    style={[
                        styles.iconContainer,
                        {
                            backgroundColor:
                                getTypeColor(notification.type) + "20",
                        },
                    ]}
                >
                    <Ionicons
                        name={getTypeIcon(notification.type)}
                        size={24}
                        color={getTypeColor(notification.type)}
                    />
                </View>
                <View style={styles.notificationInfo}>
                    <ThemedText style={styles.notificationTitle}>
                        {notification.title}
                    </ThemedText>
                    <ThemedText
                        style={[
                            styles.notificationDate,
                            { color: colors.textLight },
                        ]}
                    >
                        {notification.date}
                    </ThemedText>
                </View>
                {!notification.isRead && (
                    <View
                        style={[
                            styles.unreadDot,
                            { backgroundColor: colors.patientPrimary },
                        ]}
                    />
                )}
            </View>
            <ThemedText
                style={[
                    styles.notificationMessage,
                    { color: colors.textLight },
                ]}
            >
                {notification.message}
            </ThemedText>
        </TouchableOpacity>
    );

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
                        Notifications
                    </ThemedText>
                    <TouchableOpacity
                        style={styles.clearButton}
                        onPress={() => {
                            // Handle clear all notifications
                        }}
                    >
                        <ThemedText
                            style={[
                                styles.clearButtonText,
                                { color: colors.background },
                            ]}
                        >
                            Clear All
                        </ThemedText>
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            {/* Tab Navigation */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[
                        styles.tab,
                        selectedTab === "all" && {
                            borderBottomColor: colors.patientPrimary,
                        },
                    ]}
                    onPress={() => setSelectedTab("all")}
                >
                    <ThemedText
                        style={[
                            styles.tabText,
                            selectedTab === "all" && {
                                color: colors.patientPrimary,
                            },
                        ]}
                    >
                        All
                    </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        styles.tab,
                        selectedTab === "unread" && {
                            borderBottomColor: colors.patientPrimary,
                        },
                    ]}
                    onPress={() => setSelectedTab("unread")}
                >
                    <ThemedText
                        style={[
                            styles.tabText,
                            selectedTab === "unread" && {
                                color: colors.patientPrimary,
                            },
                        ]}
                    >
                        Unread
                    </ThemedText>
                </TouchableOpacity>
            </View>

            {/* Notifications List */}
            <View style={styles.content}>
                {filteredNotifications.map(renderNotification)}
            </View>
        </ScrollView>
    );
};

export default NotificationsScreen;

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
        width: 40,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: "bold",
    },
    clearButton: {
        padding: 8,
    },
    clearButtonText: {
        fontSize: 16,
        fontWeight: "600",
    },
    tabContainer: {
        flexDirection: "row",
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: "#E0E0E0",
    },
    tab: {
        flex: 1,
        paddingVertical: 16,
        borderBottomWidth: 2,
        borderBottomColor: "transparent",
    },
    tabText: {
        fontSize: 16,
        fontWeight: "600",
        textAlign: "center",
    },
    content: {
        padding: 16,
        gap: 16,
    },
    notificationCard: {
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
    notificationHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: "center",
        alignItems: "center",
    },
    notificationInfo: {
        flex: 1,
    },
    notificationTitle: {
        fontSize: 16,
        fontWeight: "600",
    },
    notificationDate: {
        fontSize: 12,
        marginTop: 2,
    },
    notificationMessage: {
        fontSize: 14,
        marginTop: 12,
        lineHeight: 20,
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
});
