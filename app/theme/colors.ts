export const lightTheme = {
  doctorPrimary: '#0080EC', // Medical Red
  patientPrimary: '#F3337E', // Medical Green
  background: '#FFFFFF', // Main background
  card: '#F5F5F5', // Card background
  text: '#000000', // Primary text
  textLight: '#757575', // Secondary text
  border: '#E0E0E0', // Border color
  notification: '#E53935', // Notification color
  error: '#D32F2F', // Error color - Darker Red
  success: '#43A047', // Success color - Medical Green
  warning: '#FFA000', // Warning color - Amber
  info: '#1976D2', // Info color - Medical Blue
  disabled: '#BDBDBD', // Disabled state color
  placeholder: '#9E9E9E', // Placeholder text color
  backdrop: 'rgba(0, 0, 0, 0.5)', // Backdrop color for modals
  // Status colors
  confirmed: '#4CAF50', // Confirmed appointment status
  pending: '#FFA000', // Pending appointment status
  // Shadow colors
  shadow: '#000000', // Shadow color
  elevation: {
    level1: 'rgba(229, 57, 53, 0.05)', // Red tinted shadow
    level2: 'rgba(229, 57, 53, 0.08)',
    level3: 'rgba(229, 57, 53, 0.11)',
    level4: 'rgba(229, 57, 53, 0.12)',
    level5: 'rgba(229, 57, 53, 0.14)',
  },
  red: '#EF5350',
};

export const darkTheme = {
  doctorPrimary: '#0080EC', // Medical Red
  patientPrimary: '#F3337E', // Medical Green
  background: '#121212', // Dark background
  card: '#1E1E1E', // Dark card background
  text: '#FFFFFF', // Light text for dark theme
  textLight: '#B0B0B0', // Secondary text for dark theme
  border: '#2C2C2C', // Dark border color
  notification: '#EF5350', // Notification color
  error: '#E57373', // Error color - Lighter Red
  success: '#66BB6A', // Success color - Lighter Medical Green
  warning: '#FFB74D', // Warning color - Lighter Amber
  info: '#64B5F6', // Info color - Lighter Medical Blue
  disabled: '#757575', // Disabled state color
  placeholder: '#9E9E9E', // Placeholder text color
  backdrop: 'rgba(0, 0, 0, 0.7)', // Darker backdrop for modals
  // Status colors
  confirmed: '#66BB6A', // Confirmed appointment status (lighter green for dark theme)
  pending: '#FFB74D', // Pending appointment status (lighter amber for dark theme)
  // Shadow colors
  shadow: '#000000', // Shadow color
  elevation: {
    level1: 'rgba(239, 83, 80, 0.05)', // Red tinted shadow
    level2: 'rgba(239, 83, 80, 0.08)',
    level3: 'rgba(239, 83, 80, 0.11)',
    level4: 'rgba(239, 83, 80, 0.12)',
    level5: 'rgba(239, 83, 80, 0.14)',
  },
  red: '#EF5350',
};

export type ColorScheme = typeof lightTheme;

export const colors = {
  light: lightTheme,
  dark: darkTheme,
}; 