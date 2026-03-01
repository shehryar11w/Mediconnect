import { ThemedText } from "@/components/ThemedText";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useAuth } from "../../../context/authContext";
import { useColorScheme } from "../../../hooks/useColorScheme";
import { chatService, Message } from "../../../services/chatService";
import { createGlobalStyles } from "../../../theme/styles";

type ChatPatient = {
    patientName: string;
    patientSpecialization: string;
    patientEmail: string;
    patientPhone: string;
};

const ChatDetailScreen = () => {
    const { colors } = useColorScheme();
    const globalStyles = createGlobalStyles(colors);
    const { id } = useLocalSearchParams();
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [patient, setPatient] = useState<ChatPatient | null>(null);
    const [isTyping, setIsTyping] = useState(false);
    const flatListRef = useRef<FlatList>(null);
    const { currentUser } = useAuth();
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const getToken = async () => {
        const token = await AsyncStorage.getItem("token");
        return token;
    };

    useEffect(() => {
        const handleChat = async () => {
            const token = await getToken();
            if (token) {
                fetchChatDetails();
                const unsubscribe = setupMessageListeners();

                return () => {
                    if (typingTimeoutRef.current)
                        clearTimeout(typingTimeoutRef.current);
                    unsubscribe();
                };
            }
        };
        handleChat();
    }, [currentUser, id]);

    const fetchChatDetails = async () => {
        try {
            // First: fetch patient info
            const response = await chatService.getChatDetails(id as string);
            const pat = {
                patientName: response.data.chatDetails.patientName,
                patientSpecialization:
                    response.data.chatDetails.patientSpecialization,
                patientEmail: response.data.chatDetails.patientEmail,
                patientPhone: response.data.chatDetails.patientPhone,
            };
            console.log("Patient info:", pat);
            setPatient(pat);

            // Then: fetch messages via socket
            const messages = await chatService.getChatMessages(id as string);
            console.log("Messages:", messages);
            // Sort messages by timestamp to ensure correct order
            const sortedMessages = messages?.sort(
                (a, b) =>
                    new Date(a.MessageSentAt).getTime() -
                    new Date(b.MessageSentAt).getTime(),
            );
            setMessages(
                sortedMessages?.map((message) => ({
                    MessageId: message.MessageId,
                    MessageChatId: message.MessageChatId,
                    MessageContent: message.MessageContent,
                    MessageDoctorId: message.MessageDoctorId,
                    MessageRead: message.MessageRead,
                    MessageSenderId: message.MessageSenderId,
                    MessageSenderType: message.MessageSenderType,
                    MessageSentAt: message.MessageSentAt,
                })),
            );
        } catch (error) {
            console.error("Error fetching chat details or messages:", error);
            Alert.alert("Error", "Failed to load chat data. Please try again.");
        }
    };

    const setupMessageListeners = () => {
        const unsubscribeNewMessage = chatService.onNewMessage((message) => {
            if (message.MessageChatId === Number(id)) {
                setMessages((prev) => {
                    // Check if message already exists
                    const exists = prev.some(
                        (m) => m.MessageId === message.MessageId,
                    );
                    if (exists) return prev;
                    return [...prev, message as Message];
                });
                setTimeout(
                    () => flatListRef.current?.scrollToEnd({ animated: true }),
                    100,
                );
            }
        });

        const unsubscribeTyping = chatService.onTypingStatus((data) => {
            if (data.chatId === id) {
                setIsTyping(data.isTyping);
            }
        });

        const unsubscribeReadReceipt = chatService.onReadReceipt((data) => {
            if (data.chatId === id) {
                setMessages((prev) =>
                    prev.map((msg) =>
                        msg.MessageRead !== true
                            ? { ...msg, MessageRead: true }
                            : msg,
                    ),
                );
            }
        });

        return () => {
            unsubscribeNewMessage();
            unsubscribeTyping();
            unsubscribeReadReceipt();
        };
    };

    const handleTyping = () => {
        chatService.sendTypingStatus(id as string);

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
            chatService.sendTypingStopped(id as string);
        }, 1000);
    };

    const sendMessage = () => {
        if (message.trim().length === 0) return;

        try {
            chatService.sendMessage(id as string, message.trim());
            setMessage("");
        } catch (error) {
            console.error("Error sending message:", error);
            Alert.alert("Error", "Failed to send message. Please try again.");
        }
    };

    const getStatusIcon = (status: Message["MessageRead"]) => {
        switch (status) {
            case true:
                return "checkmark-done";
            case false:
                return "checkmark";
            default:
                return "checkmark";
        }
    };

    const isDoctorMessage = (role: Message["MessageSenderType"]) =>
        role === "doctor";
    const isPatientMessage = (role: Message["MessageSenderType"]) =>
        role === "patient";

    const renderMessage = ({ item }: { item: Message }) => (
        <View
            style={[
                styles.messageContainer,
                isDoctorMessage(item.MessageSenderType)
                    ? styles.doctorMessage
                    : styles.patientMessage,
            ]}
        >
            {isPatientMessage(item.MessageSenderType) && patient && (
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
                        {patient.patientName.charAt(0)}
                    </ThemedText>
                </View>
            )}
            <View
                style={[
                    styles.messageBubble,
                    {
                        backgroundColor: isDoctorMessage(item.MessageSenderType)
                            ? colors.background
                            : "#FF4444",
                    },
                ]}
            >
                <ThemedText
                    style={[
                        styles.messageText,
                        {
                            color: isDoctorMessage(item.MessageSenderType)
                                ? colors.text
                                : colors.background,
                        },
                    ]}
                >
                    {item.MessageContent}
                </ThemedText>
                <View style={styles.messageFooter}>
                    <ThemedText
                        style={[
                            styles.messageTime,
                            {
                                color: isDoctorMessage(item.MessageSenderType)
                                    ? colors.textLight
                                    : colors.background + "CC",
                            },
                        ]}
                    >
                        {new Date(item.MessageSentAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                        })}
                    </ThemedText>
                    {isDoctorMessage(item.MessageSenderType) && (
                        <Ionicons
                            name={getStatusIcon(item.MessageRead)}
                            size={16}
                            color={colors.textLight}
                            style={styles.statusIcon}
                        />
                    )}
                </View>
            </View>
        </View>
    );

    return (
        <KeyboardAvoidingView
            style={[globalStyles.container, styles.container]}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
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
                    <View style={styles.headerInfo}>
                        <View
                            style={[
                                styles.avatar,
                                { backgroundColor: colors.background },
                            ]}
                        >
                            <ThemedText
                                style={[
                                    styles.avatarText,
                                    { color: colors.doctorPrimary },
                                ]}
                            >
                                {patient?.patientName.charAt(0)}
                            </ThemedText>
                        </View>
                        <View>
                            <ThemedText
                                style={[
                                    styles.headerTitle,
                                    { color: colors.background },
                                ]}
                            >
                                {patient?.patientName}
                            </ThemedText>
                        </View>
                    </View>
                </View>
            </LinearGradient>

            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item) => item.MessageId.toString()}
                contentContainerStyle={styles.messagesList}
                showsVerticalScrollIndicator={false}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
            />

            {isTyping && (
                <View style={styles.typingIndicator}>
                    <ThemedText
                        style={[styles.typingText, { color: colors.textLight }]}
                    >
                        Patient is typing...
                    </ThemedText>
                </View>
            )}

            <View
                style={[
                    styles.inputContainer,
                    { backgroundColor: colors.background },
                ]}
            >
                <TextInput
                    style={[
                        styles.input,
                        {
                            color: colors.text,
                            backgroundColor: colors.background,
                        },
                    ]}
                    placeholder="Type a message..."
                    placeholderTextColor={colors.textLight}
                    value={message}
                    onChangeText={setMessage}
                    onFocus={handleTyping}
                    multiline
                />
                <TouchableOpacity
                    style={[
                        styles.sendButton,
                        {
                            backgroundColor:
                                message.trim().length > 0
                                    ? colors.doctorPrimary
                                    : colors.textLight,
                        },
                    ]}
                    onPress={sendMessage}
                    disabled={message.trim().length === 0}
                >
                    <Ionicons name="send" size={20} color={colors.background} />
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerGradient: {
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
    },
    backButton: {
        padding: 8,
        marginRight: 8,
        backgroundColor: "rgba(255, 255, 255, 0.2)",
        borderRadius: 12,
    },
    headerInfo: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
        backgroundColor: "rgba(255, 255, 255, 0.2)",
    },
    avatarText: {
        fontSize: 20,
        fontWeight: "bold",
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 2,
    },
    headerSubtitle: {
        fontSize: 13,
        opacity: 0.8,
    },
    messagesList: {
        padding: 16,
        paddingBottom: 24,
    },
    messageContainer: {
        marginBottom: 16,
        maxWidth: "80%",
        flexDirection: "row",
        gap: 8,
    },
    doctorMessage: {
        alignSelf: "flex-end",
    },
    patientMessage: {
        alignSelf: "flex-start",
    },
    messageBubble: {
        padding: 14,
        borderRadius: 24,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 20,
        marginBottom: 4,
    },
    messageFooter: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: 4,
    },
    messageTime: {
        fontSize: 11,
        opacity: 0.7,
    },
    statusIcon: {
        marginLeft: 4,
    },
    typingIndicator: {
        padding: 8,
        paddingLeft: 16,
        paddingBottom: 4,
    },
    typingText: {
        fontSize: 12,
        fontStyle: "italic",
        opacity: 0.7,
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        padding: 12,
        paddingHorizontal: 16,
        borderTopWidth: 1,
        borderTopColor: "#E5E5E5",
        gap: 12,
        backgroundColor: "#FFFFFF",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: -2,
        },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 5,
    },
    input: {
        flex: 1,
        fontSize: 15,
        maxHeight: 100,
        padding: 0,
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: "#F5F5F5",
        borderRadius: 20,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
});

export default ChatDetailScreen;
