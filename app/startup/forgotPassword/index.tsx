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

const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type EmailFormData = z.infer<typeof emailSchema>;

export default function ForgotPasswordScreen() {
  const { colors } = useColorScheme();
  const { userType } = useLocalSearchParams<{ userType: 'doctor' | 'patient' }>();
  const [formData, setFormData] = useState<EmailFormData>({
    email: '',
  });
  const [errors, setErrors] = useState<Partial<EmailFormData>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [backendError, setBackendError] = useState('');
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

  const validateField = (field: keyof EmailFormData, value: string) => {
    try {
      emailSchema.shape[field].parse(value);
      setErrors(prev => ({ ...prev, [field]: undefined }));
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors(prev => ({ ...prev, [field]: error.errors[0].message }));
      }
      return false;
    }
  };

  const handleSendCode = async () => {
    setIsLoading(true);
    setBackendError('');
    setErrors({});
    
    try {
      const validatedData = emailSchema.parse(formData);
      
      // TODO: Implement API call to send reset code
      const result = await authService.sendResetCode(validatedData.email);
      console.log(result);
      
      // Navigate to code verification screen
      router.push({
        pathname: '/startup/forgotPassword/verify',
        params: { 
          email: validatedData.email,
          userType 
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Partial<EmailFormData> = {};
        error.errors.forEach(err => {
          const field = err.path[0] as keyof EmailFormData;
          newErrors[field] = err.message;
        });
        setErrors(newErrors);
      } else {
        setBackendError(error ? error as string : 'An unexpected error occurred');
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
            name="lock-reset" 
            size={40} 
            color={colors.doctorPrimary}
          />
        </View>
        <ThemedText type="title" style={[styles.title, { color: colors.doctorPrimary }]}>
          Forgot Password
        </ThemedText>
        <ThemedText style={[styles.subtitle, { color: colors.textLight }]}>
          Enter your email to receive a reset code
        </ThemedText>
      </Animated.View>

      <Animated.View style={[styles.formContainer, formStyle]}>
        <View>
          <View style={[styles.inputContainer, errors.email && styles.errorText, { backgroundColor: colors.background,borderColor: colors.border }]}>
            <MaterialCommunityIcons name="email" size={24} color={colors.textLight} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Email"
              placeholderTextColor={colors.textLight}
              value={formData.email}
              onChangeText={(text) => {
                setFormData(prev => ({ ...prev, email: text }));
                validateField('email', text);
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isLoading}
            />
          </View>
          {errors.email && (
            <ThemedText style={styles.errorText}>{errors.email}</ThemedText>
          )}
        </View>

        {backendError && (
          <View style={styles.backendError}>
            <ThemedText style={styles.backendErrorText}>{backendError}</ThemedText>
          </View>
        )}

        <TouchableOpacity 
          style={[
            styles.sendCodeButton,
            { backgroundColor: colors.doctorPrimary },
            isLoading && { backgroundColor: colors.textLight }
          ]}
          onPress={handleSendCode}
          disabled={isLoading}>
          <ThemedText style={[styles.sendCodeButtonText, { color: colors.background }]}>
            {isLoading ? 'Sending Code...' : 'Send Reset Code'}
          </ThemedText>
        </TouchableOpacity>

        <View style={styles.helpContainer}>
          <ThemedText style={[styles.helpText, { color: colors.textLight }]}>
            Remember your password?{' '}
          </ThemedText>
          <TouchableOpacity onPress={handleBack}>
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
  sendCodeButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    opacity: 1,
  },
  sendCodeButtonText: {
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