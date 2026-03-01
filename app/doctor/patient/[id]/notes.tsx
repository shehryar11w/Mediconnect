import { ThemedText } from "@/components/ThemedText";
import { useColorScheme } from "@/hooks/useColorScheme";
import { notesService } from "@/services/NotesService";
import { createGlobalStyles } from "@/theme/styles";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

type Note = {
    id: string;
    date: string;
    content: string;
    category: "General" | "Symptoms" | "Treatment" | "Follow-up";
};

type ValidationErrors = {
    content?: string;
    category?: string;
};

const NotesScreen = () => {
    const { colors } = useColorScheme();
    const globalStyles = createGlobalStyles(colors);
    const { id } = useLocalSearchParams<{ id: string }>();
    const [isAdding, setIsAdding] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [notes, setNotes] = useState<Note[]>([]);
    const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
        {},
    );
    const [backendError, setBackendError] = useState<string | null>(null);
    const [newNote, setNewNote] = useState({
        content: "",
        category: "General" as Note["category"],
    });

    const fetchNotes = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await notesService.getNotes(parseInt(id));
            console.log(response.data);
            if (response.success) {
                const formattedNotes = response.data.map((note: any) => ({
                    id: note.NoteId.toString(),
                    date: note.NoteDateTime.split("T")[0],
                    content: note.NoteContent,
                    category:
                        note.NoteStatus.charAt(0).toUpperCase() +
                        note.NoteStatus.slice(1),
                }));
                setNotes(formattedNotes);
            } else {
                Alert.alert("Error", "Failed to fetch notes");
            }
        } catch (error) {
            console.error("Error fetching notes:", error);
            Alert.alert("Error", "Failed to fetch notes");
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchNotes();
    }, [fetchNotes]);

    const validateForm = (): boolean => {
        const errors: ValidationErrors = {};
        let isValid = true;

        if (!newNote.content.trim()) {
            errors.content = "Note content is required";
            isValid = false;
        }

        if (!newNote.category) {
            errors.category = "Category is required";
            isValid = false;
        }

        setValidationErrors(errors);
        return isValid;
    };

    const handleAddNote = async () => {
        setBackendError(null);
        setValidationErrors({});

        if (!validateForm()) {
            return;
        }

        try {
            const noteData = {
                content: newNote.content.trim(),
                category: newNote.category,
            };

            const response = await notesService.addNotes(
                parseInt(id),
                noteData.content,
                noteData.category,
            );

            if (response.success) {
                Alert.alert("Success", "Note added successfully");
                setIsAdding(false);
                setNewNote({
                    content: "",
                    category: "General",
                });
                fetchNotes();
            } else {
                setBackendError(response.message || "Failed to add note");
            }
        } catch (error: any) {
            console.error("Error adding note:", error);
            setBackendError(error.message || "Failed to add note");
        }
    };

    const renderNoteCard = (note: Note) => (
        <View
            key={note.id}
            style={[styles.noteCard, { backgroundColor: colors.background }]}
        >
            <View style={styles.noteHeader}>
                <View
                    style={[
                        styles.categoryBadge,
                        {
                            backgroundColor: colors.doctorPrimary + "20",
                        },
                    ]}
                >
                    <ThemedText
                        style={[
                            styles.categoryText,
                            { color: colors.doctorPrimary },
                        ]}
                    >
                        {note.category}
                    </ThemedText>
                </View>
                <ThemedText
                    style={[styles.noteDate, { color: colors.textLight }]}
                >
                    {note.date}
                </ThemedText>
            </View>

            <ThemedText style={styles.noteContent}>{note.content}</ThemedText>
        </View>
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
                <ThemedText>Loading notes...</ThemedText>
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
                        Clinical Notes
                    </ThemedText>
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => setIsAdding(true)}
                    >
                        <Ionicons
                            name="add"
                            size={24}
                            color={colors.background}
                        />
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            <ScrollView style={styles.content}>
                {isAdding ? (
                    <View
                        style={[
                            styles.addCard,
                            { backgroundColor: colors.background },
                        ]}
                    >
                        <ThemedText style={styles.addTitle}>
                            New Note
                        </ThemedText>

                        {backendError && (
                            <View
                                style={[
                                    styles.errorBox,
                                    { backgroundColor: colors.error + "20" },
                                ]}
                            >
                                <ThemedText
                                    style={[
                                        styles.errorBoxText,
                                        { color: colors.error },
                                    ]}
                                >
                                    {backendError}
                                </ThemedText>
                            </View>
                        )}

                        <View style={styles.inputGroup}>
                            <ThemedText
                                style={[
                                    styles.inputLabel,
                                    { color: colors.textLight },
                                ]}
                            >
                                Category
                            </ThemedText>
                            <View style={styles.categoryButtons}>
                                {(
                                    [
                                        "General",
                                        "Symptoms",
                                        "Treatment",
                                        "Follow-up",
                                    ] as const
                                ).map((category) => (
                                    <TouchableOpacity
                                        key={category}
                                        style={[
                                            styles.categoryButton,
                                            {
                                                backgroundColor:
                                                    newNote.category ===
                                                    category
                                                        ? colors.doctorPrimary
                                                        : colors.background,
                                                borderColor:
                                                    validationErrors.category
                                                        ? colors.error
                                                        : colors.textLight,
                                            },
                                        ]}
                                        onPress={() => {
                                            setNewNote({
                                                ...newNote,
                                                category,
                                            });
                                            if (validationErrors.category) {
                                                setValidationErrors({
                                                    ...validationErrors,
                                                    category: undefined,
                                                });
                                            }
                                        }}
                                    >
                                        <ThemedText
                                            style={[
                                                styles.categoryButtonText,
                                                {
                                                    color:
                                                        newNote.category ===
                                                        category
                                                            ? colors.background
                                                            : colors.text,
                                                },
                                            ]}
                                        >
                                            {category}
                                        </ThemedText>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            {validationErrors.category && (
                                <ThemedText
                                    style={[
                                        styles.errorText,
                                        { color: colors.error },
                                    ]}
                                >
                                    {validationErrors.category}
                                </ThemedText>
                            )}
                        </View>

                        <View style={styles.inputGroup}>
                            <ThemedText
                                style={[
                                    styles.inputLabel,
                                    { color: colors.textLight },
                                ]}
                            >
                                Note
                            </ThemedText>
                            <TextInput
                                style={[
                                    styles.input,
                                    styles.textArea,
                                    {
                                        color: colors.text,
                                        borderColor: validationErrors.content
                                            ? colors.error
                                            : colors.textLight,
                                    },
                                ]}
                                value={newNote.content}
                                onChangeText={(text) => {
                                    setNewNote({ ...newNote, content: text });
                                    if (validationErrors.content) {
                                        setValidationErrors({
                                            ...validationErrors,
                                            content: undefined,
                                        });
                                    }
                                }}
                                placeholder="Enter your clinical note..."
                                placeholderTextColor={colors.textLight}
                                multiline
                                numberOfLines={8}
                            />
                            {validationErrors.content && (
                                <ThemedText
                                    style={[
                                        styles.errorText,
                                        { color: colors.error },
                                    ]}
                                >
                                    {validationErrors.content}
                                </ThemedText>
                            )}
                        </View>

                        <View style={styles.buttonGroup}>
                            <TouchableOpacity
                                style={[
                                    styles.button,
                                    styles.cancelButton,
                                    { backgroundColor: colors.textLight },
                                ]}
                                onPress={() => {
                                    setIsAdding(false);
                                    setValidationErrors({});
                                    setBackendError(null);
                                }}
                            >
                                <ThemedText
                                    style={[
                                        styles.buttonText,
                                        { color: colors.background },
                                    ]}
                                >
                                    Cancel
                                </ThemedText>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.button,
                                    styles.saveButton,
                                    { backgroundColor: colors.doctorPrimary },
                                ]}
                                onPress={handleAddNote}
                            >
                                <ThemedText
                                    style={[
                                        styles.buttonText,
                                        { color: colors.background },
                                    ]}
                                >
                                    Save
                                </ThemedText>
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    <>
                        {notes.length === 0 ? (
                            <View style={styles.emptyContainer}>
                                <ThemedText style={styles.emptyText}>
                                    No notes found
                                </ThemedText>
                            </View>
                        ) : (
                            notes.map(renderNoteCard)
                        )}
                    </>
                )}
            </ScrollView>
        </View>
    );
};

export default NotesScreen;

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
    addButton: {
        padding: 8,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    noteCard: {
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
    noteHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    categoryBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    categoryText: {
        fontSize: 12,
        fontWeight: "600",
    },
    noteDate: {
        fontSize: 14,
    },
    noteContent: {
        fontSize: 16,
        lineHeight: 24,
    },
    attachments: {
        flexDirection: "row",
        flexWrap: "wrap",
        marginTop: 12,
        gap: 8,
    },
    attachmentButton: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    attachmentText: {
        marginLeft: 4,
        fontSize: 12,
        fontWeight: "500",
    },
    addCard: {
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
    addTitle: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 16,
    },
    inputGroup: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 14,
        marginBottom: 8,
    },
    categoryButtons: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    categoryButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
    },
    categoryButtonText: {
        fontSize: 14,
        fontWeight: "500",
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
    },
    textArea: {
        height: 200,
        textAlignVertical: "top",
    },
    buttonGroup: {
        flexDirection: "row",
        justifyContent: "flex-end",
        gap: 12,
    },
    button: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
        minWidth: 100,
        alignItems: "center",
    },
    cancelButton: {
        backgroundColor: "#E5E5E5",
    },
    saveButton: {
        backgroundColor: "#007AFF",
    },
    buttonText: {
        fontSize: 16,
        fontWeight: "600",
    },
    loadingContainer: {
        justifyContent: "center",
        alignItems: "center",
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: 40,
    },
    emptyText: {
        fontSize: 16,
        color: "#666",
        fontStyle: "italic",
    },
    errorText: {
        fontSize: 12,
        marginTop: 4,
    },
    errorBox: {
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
    },
    errorBoxText: {
        fontSize: 14,
    },
});
