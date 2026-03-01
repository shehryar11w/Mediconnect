import { StyleSheet } from "react-native";
import { darkTheme, lightTheme } from "./colors";

type ThemeColors = typeof lightTheme | typeof darkTheme;

export const createGlobalStyles = (colors: ThemeColors) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
            fontFamily: "SpaceMono-Regular",
        },
        screenContainer: {
            flex: 1,
            backgroundColor: colors.background,
            padding: 16,
        },
        text: {
            color: colors.text,
            fontSize: 16,
        },
        heading: {
            color: colors.text,
            fontSize: 24,
            fontWeight: "bold",
        },
        button: {
            padding: 12,
            borderRadius: 8,
            alignItems: "center",
        },
        buttonText: {
            color: colors.background,
            fontSize: 16,
            fontWeight: "600",
        },
        input: {
            backgroundColor: colors.background,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 8,
            padding: 12,
            color: colors.text,
        },
        card: {
            backgroundColor: colors.background,
            borderRadius: 12,
            padding: 16,
            shadowColor: colors.text,
            shadowOffset: {
                width: 0,
                height: 2,
            },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
        },
    });
