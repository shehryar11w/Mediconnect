import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { authService } from '@/services/authService';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
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

const codeSchema = z.object({
  code: z.string().min(1, 'Please enter the verification code'),
});

type CodeFormData = z.infer<typeof codeSchema>;

export default function VerifyCodeScreen() {
  const { colors } = useColorScheme();
  const { email, userType } = useLocalSearchParams<{ 
    email: string; 
    userType: 'doctor' | 'patient' 
  }>();
  const [formData, setFormData] = useState<CodeFormData>({
    code: '',
  });
  const [errors, setErrors] = useState<Partial<CodeFormData>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [backendError, setBackendError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const codeInputRef = useRef<TextInput>(null);
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

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const validateField = (field: keyof CodeFormData, value: string) => {
    try {
      codeSchema.shape[field].parse(value);
      setErrors(prev => ({ ...prev, [field]: undefined }));
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors(prev => ({ ...prev, [field]: error.errors[0].message }));
      }
      return false;
    }
  };

  const handleVerifyCode = async () => {
    setIsLoading(true);
    setBackendError('');
    setErrors({});
    
    try {
      const validatedData = codeSchema.parse(formData);
      
      // TODO: Implement API call to verify JWT token
      const result = await authService.verifyResetCode(validatedData.code);
      console.log(result);
      
      // Navigate to new password screen
      router.push({
        pathname: '/startup/forgotPassword/reset',
        params: { 
          email,
          userId: result.user.id,
          userType: result.user.role
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Partial<CodeFormData> = {};
        error.errors.forEach(err => {
          const field = err.path[0] as keyof CodeFormData;
          newErrors[field] = err.message;
        });
        setErrors(newErrors);
      } else {
        setBackendError(error ? error as string : 'Invalid verification token');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendTimer > 0) return;
    
    setResendTimer(60);
    
    await authService.sendResetCode(email);
 
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
            name="shield-check" 
            size={40} 
            color={colors.doctorPrimary}
          />
        </View>
        <ThemedText type="title" style={[styles.title, { color: colors.doctorPrimary }]}>
          Verify Token
        </ThemedText>
        <ThemedText style={[styles.subtitle, { color: colors.textLight }]}>
          Enter the verification token sent to
        </ThemedText>
        <ThemedText style={[styles.email, { color: colors.doctorPrimary }]}>
          {email}
        </ThemedText>
      </Animated.View>

      <Animated.View style={[styles.formContainer, formStyle]}>
        <View>
          <View style={[styles.inputContainer, errors.code && styles.inputError, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <MaterialCommunityIcons name="key" size={24} color={colors.textLight} />
            <TextInput
              ref={codeInputRef}
              style={[styles.input, { color: colors.text }]}
              placeholder="Enter verification token"
              placeholderTextColor={colors.textLight}
              value={formData.code}
              onChangeText={(text) => {
                setFormData(prev => ({ ...prev, code: text }));
                validateField('code', text);
              }}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
          </View>
          {errors.code && (
            <ThemedText style={styles.errorText}>{errors.code}</ThemedText>
          )}
        </View>

        {backendError && (
          <View style={styles.backendError}>
            <ThemedText style={styles.backendErrorText}>{backendError}</ThemedText>
          </View>
        )}

        <TouchableOpacity 
          style={[
            styles.verifyButton,
            { backgroundColor: colors.doctorPrimary },
            isLoading && { backgroundColor: colors.textLight }
          ]}
          onPress={handleVerifyCode}
          disabled={isLoading}>
          <ThemedText style={[styles.verifyButtonText, { color: colors.background }]}>
            {isLoading ? 'Verifying...' : 'Verify Token'}
          </ThemedText>
        </TouchableOpacity>

        <View style={styles.resendContainer}>
          <ThemedText style={[styles.resendText, { color: colors.textLight }]}>
            Didn&apos;t receive the token?{' '}
          </ThemedText>
          <TouchableOpacity 
            onPress={handleResendCode}
            disabled={resendTimer > 0}>
            <ThemedText style={[
              styles.resendLink, 
              { color: resendTimer > 0 ? colors.textLight : colors.doctorPrimary }
            ]}>
              {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Token'}
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
  email: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
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
  verifyButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    opacity: 1,
  },
  verifyButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  resendText: {
    fontSize: 14,
  },
  resendLink: {
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