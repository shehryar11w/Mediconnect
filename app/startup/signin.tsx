import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/context/authContext';
import { useColorScheme } from '@/hooks/useColorScheme';
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

const signInSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type SignInFormData = z.infer<typeof signInSchema>;

export default function SignInScreen() {
  const { colors} = useColorScheme();
  const { userType } = useLocalSearchParams<{ userType: 'doctor' | 'patient' }>();
  const { login } = useAuth();
  const [formData, setFormData] = useState<SignInFormData>({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Partial<SignInFormData>>({});
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

  const validateField = (field: keyof SignInFormData, value: string) => {
    try {
      signInSchema.shape[field].parse(value);
      setErrors(prev => ({ ...prev, [field]: undefined }));
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors(prev => ({ ...prev, [field]: error.errors[0].message }));
      }
      return false;
    }
  };

  const handleSignIn = async () => {
    setIsLoading(true);
    setBackendError('');
    setErrors({});
    
    try {
      const validatedData = signInSchema.parse(formData);
      const result = await login(validatedData.email, validatedData.password, userType);
      
      if (result.error) {
        setBackendError(result.error.message || 'Failed to sign in');
      } else if (result.user) {
        router.replace(`/${userType}/dashboard`);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Partial<SignInFormData> = {};
        error.errors.forEach(err => {
          const field = err.path[0] as keyof SignInFormData;
          newErrors[field] = err.message;
        });
        setErrors(newErrors);
      } else {
        setBackendError(error? error as string : 'An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = () => {
    router.push({
      pathname: '/startup/signup',
      params: { userType }
    });
  };

  const handleBack = () => {
    router.replace('/startup/onboarding');
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
            color={userType === 'doctor' ? colors.doctorPrimary : colors.patientPrimary}
          />
          <ThemedText style={[styles.backButtonText, { color: userType === 'doctor' ? colors.doctorPrimary : colors.patientPrimary }]}>
            Back
          </ThemedText>
        </TouchableOpacity>
      </Animated.View>

      <Animated.View style={[styles.header, headerStyle]}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons 
            name={userType === 'doctor' ? 'doctor' : 'account-heart'} 
            size={40} 
            color={userType === 'doctor' ? colors.doctorPrimary : colors.patientPrimary}
          />
        </View>
        <ThemedText type="title" style={[styles.title, { color: userType === 'doctor' ? colors.doctorPrimary : colors.patientPrimary }]}>
          Welcome Back
        </ThemedText>
        <ThemedText style={[styles.subtitle, { color: colors.textLight }]}>
          Sign in to continue as {userType}
        </ThemedText>
      </Animated.View>

      <Animated.View style={[styles.formContainer, formStyle]}>
        <View>
          <View style={[styles.inputContainer, errors.email && styles.inputError, { backgroundColor: colors.background,borderColor: colors.border }]}>
            <MaterialCommunityIcons name="email" size={24} color={colors.textLight} />
            <TextInput
              style={[styles.input, { color: colors.text,backgroundColor: colors.background }]}
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

        <View>
          <View style={[styles.inputContainer, errors.password && styles.inputError, { backgroundColor: colors.background,borderColor: colors.border }]}>
            <MaterialCommunityIcons name="lock" size={24} color={colors.textLight} />
            <TextInput
              style={[styles.input, { color: colors.text,backgroundColor: colors.background }]}
              placeholder="Password"
              placeholderTextColor={colors.textLight}
              value={formData.password}
              onChangeText={(text) => {
                setFormData(prev => ({ ...prev, password: text }));
                validateField('password', text);
              }}
              secureTextEntry
              editable={!isLoading}
            />
          </View>
          {errors.password && (
            <ThemedText style={styles.errorText}>{errors.password}</ThemedText>
          )}
        </View>

        {backendError && (
          <View style={[styles.backendError,{borderColor: colors.error}]}>
            <ThemedText style={[styles.backendErrorText,{color: colors.error}]}>{backendError}</ThemedText>
          </View>
        )}

        <TouchableOpacity 
          style={styles.forgotPassword}
          onPress={() => router.push({
            pathname: '/startup/forgotPassword' as any,
            params: { userType }
          })}>
          <ThemedText style={[styles.forgotPasswordText, { color: userType === 'doctor' ? colors.doctorPrimary : colors.patientPrimary }]}>
            Forgot Password?
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[
            styles.signInButton,
            { backgroundColor: userType === 'doctor' ? colors.doctorPrimary : colors.patientPrimary },
            isLoading && { backgroundColor: colors.textLight }
          ]}
          onPress={handleSignIn}
          disabled={isLoading}>
          <ThemedText style={[styles.signInButtonText, { color: colors.background }]}>
            {isLoading ? 'Signing In...' : 'Sign In'}
          </ThemedText>
        </TouchableOpacity>

        <View style={styles.signUpContainer}>
          <ThemedText style={[styles.signUpText, { color: colors.textLight }]}>
            Don&apos;t have an account?{' '}
          </ThemedText>
          <TouchableOpacity onPress={handleSignUp}>
            <ThemedText style={[styles.signUpLink, { color: userType === 'doctor' ? colors.doctorPrimary : colors.patientPrimary }]}>
              Sign Up
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
    color: '#2563eb',
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
    color: '#1e293b',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
    marginBottom: 8,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
  },
  forgotPasswordText: {
    // color: '#2563eb',
    fontSize: 14,
  },
  signInButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    opacity: 1,
  },
  signInButtonDisabled: {
    opacity: 0.7,
  },
  signInButtonText: {
    // color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  signUpText: {
    // color: '#64748b',
    fontSize: 14,
  },
  signUpLink: {
    // color: '#2563eb',
    fontSize: 14,
    fontWeight: '600',
  },
  backendError: {
    // backgroundColor: '#fef2f2',
    borderWidth: 1,
    // borderColor: '#ef4444',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  backendErrorText: {
    // color: '#ef4444',
    fontSize: 14,
    textAlign: 'center',
  },
}); 