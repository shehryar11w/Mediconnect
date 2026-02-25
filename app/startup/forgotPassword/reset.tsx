import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { authService } from '@/services/authService';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { z } from 'zod';

const passwordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type PasswordFormData = z.infer<typeof passwordSchema>;

export default function ResetPasswordScreen() {
  const { colors } = useColorScheme();
  const { userId, userType } = useLocalSearchParams<{ 
    email: string; 
    userId: string;
    userType: 'doctor' | 'patient' 
  }>();
  const [formData, setFormData] = useState<PasswordFormData>({
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Partial<PasswordFormData>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [backendError, setBackendError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const scale = useSharedValue(0.3);
  const opacity = useSharedValue(0);
  const formOpacity = useSharedValue(0);
  const backButtonOpacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, {
      damping: 8,
      stiffness: 100,
    });

    opacity.value = withSequence(
      withDelay(300, withTiming(1, { duration: 800 }))
    );

    formOpacity.value = withSequence(
      withDelay(600, withTiming(1, { duration: 800 }))
    );

    backButtonOpacity.value = withTiming(1, { duration: 500 });
  }, []);

  const validateField = (field: keyof PasswordFormData, value: string) => {
    try {
      if (field === 'confirmPassword') {
        passwordSchema.parse({ ...formData, [field]: value });
      } else {
        passwordSchema.parse({ ...formData, [field]: value });
      }
      setErrors(prev => ({ ...prev, [field]: undefined }));
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldError = error.errors.find(err => err.path.includes(field));
        if (fieldError) {
          setErrors(prev => ({ ...prev, [field]: fieldError.message }));
        }
      }
      return false;
    }
  };

  const handleResetPassword = async () => {
    setIsLoading(true);
    setBackendError('');
    setErrors({});
    
    try {
      const validatedData = passwordSchema.parse(formData);
      console.log(userId);
      console.log(validatedData.password);
      // TODO: Implement API call to reset password
      const result = await authService.resetPassword(validatedData.password,userType,userId);
      console.log(result);
      
      // Navigate to sign in screen with success message
      router.replace({
        pathname: '/startup/signin',
        params: { 
          userType,
          message: 'Password reset successfully! Please sign in with your new password.'
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Partial<PasswordFormData> = {};
        error.errors.forEach(err => {
          const field = err.path[0] as keyof PasswordFormData;
          newErrors[field] = err.message;
        });
        setErrors(newErrors);
      } else {
        setBackendError(error ? error as string : 'Failed to reset password');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const headerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: withSpring(opacity.value * 20) }],
  }));

  const formStyle = useAnimatedStyle(() => ({
    opacity: formOpacity.value,
    transform: [{ translateY: withSpring(formOpacity.value * 20) }],
  }));

  const backButtonStyle = useAnimatedStyle(() => ({
    opacity: backButtonOpacity.value,
    transform: [{ translateX: withSpring(backButtonOpacity.value * 10) }],
  }));

  return (
    <ThemedView style={styles.container}>
      <Animated.View style={[styles.backButtonContainer, backButtonStyle]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleBack}>
          <Ionicons 
            name="arrow-back" 
            size={24} 
            color={colors.doctorPrimary}
          />
          <ThemedText style={[styles.backButtonText, { color: colors.doctorPrimary }]}>
            Back
          </ThemedText>
        </TouchableOpacity>
      </Animated.View>

      <Animated.View style={[styles.header, headerStyle]}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons 
            name="lock-open" 
            size={40} 
            color={colors.doctorPrimary}
          />
        </View>
        <ThemedText type="title" style={[styles.title, { color: colors.doctorPrimary }]}>
          New Password
        </ThemedText>
        <ThemedText style={[styles.subtitle, { color: colors.textLight }]}>
          Create a new password for your account
        </ThemedText>
      </Animated.View>

      <Animated.View style={[styles.formContainer, formStyle]}>
        <View>
          <View style={[styles.inputContainer, errors.password && styles.errorText, { backgroundColor: colors.background,borderColor: colors.border }]}>
            <MaterialCommunityIcons name="lock" size={24} color={colors.textLight} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="New Password"
              placeholderTextColor={colors.textLight}
              value={formData.password}
              onChangeText={(text) => {
                setFormData(prev => ({ ...prev, password: text }));
                validateField('password', text);
              }}
              secureTextEntry={!showPassword}
              editable={!isLoading}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <MaterialCommunityIcons 
                name={showPassword ? "eye-off" : "eye"} 
                size={24} 
                color={colors.textLight} 
              />
            </TouchableOpacity>
          </View>
          {errors.password && (
            <ThemedText style={styles.errorText}>{errors.password}</ThemedText>
          )}
        </View>

        <View>
          <View style={[styles.inputContainer, errors.confirmPassword && styles.errorText, { backgroundColor: colors.background,borderColor: colors.border }]}>
            <MaterialCommunityIcons name="lock-check" size={24} color={colors.textLight} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Confirm New Password"
              placeholderTextColor={colors.textLight}
              value={formData.confirmPassword}
              onChangeText={(text) => {
                setFormData(prev => ({ ...prev, confirmPassword: text }));
                validateField('confirmPassword', text);
              }}
              secureTextEntry={!showConfirmPassword}
              editable={!isLoading}
            />
            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
              <MaterialCommunityIcons 
                name={showConfirmPassword ? "eye-off" : "eye"} 
                size={24} 
                color={colors.textLight} 
              />
            </TouchableOpacity>
          </View>
          {errors.confirmPassword && (
            <ThemedText style={styles.errorText}>{errors.confirmPassword}</ThemedText>
          )}
        </View>

        {backendError && (
          <View style={[styles.backendError,{borderColor: colors.error}]}>
            <ThemedText style={[styles.backendErrorText,{color: colors.error}]}>{backendError}</ThemedText>
          </View>
        )}

        <TouchableOpacity 
          style={[
            styles.resetButton,
            { backgroundColor: colors.doctorPrimary },
            isLoading && { backgroundColor: colors.textLight }
          ]}
          onPress={handleResetPassword}
          disabled={isLoading}>
          <ThemedText style={[styles.resetButtonText, { color: colors.background }]}>
            {isLoading ? 'Resetting Password...' : 'Reset Password'}
          </ThemedText>
        </TouchableOpacity>

        <View style={styles.helpContainer}>
          <ThemedText style={[styles.helpText, { color: colors.textLight }]}>
            Remember your password?{' '}
          </ThemedText>
          <TouchableOpacity onPress={() => router.replace('/startup/signin')}>
            <ThemedText style={[styles.helpLink, { color: colors.doctorPrimary }]}>
              Sign In
            </ThemedText>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  backButtonContainer: {
    position: 'absolute',
    top: 40,
    left: 24,
    zIndex: 1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.8,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  formContainer: {
    gap: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    marginBottom: 4,
  },
  inputError: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
    marginBottom: 8,
  },
  resetButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    opacity: 1,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  helpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  helpText: {
    fontSize: 14,
  },
  helpLink: {
    fontSize: 14,
    fontWeight: '600',
  },
  backendError: {
    borderWidth: 1,
    borderColor: '#ef4444',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  backendErrorText: {
    color: '#ef4444',
    fontSize: 14,
    textAlign: 'center',
  },
}); 