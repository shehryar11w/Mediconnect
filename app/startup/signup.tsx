import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/context/authContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { z } from 'zod';

const { width } = Dimensions.get('window');

const baseSignUpSchema = {
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
};

type BaseSignUpData = {
  name: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
  specialization?: string;
};

type DoctorSignUpData = BaseSignUpData & {
  specialization: string;
};

type PatientSignUpData = BaseSignUpData;

const doctorSignUpSchema = z.object({
  ...baseSignUpSchema,
  specialization: z.string().min(2, 'Please enter your specialization'),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const patientSignUpSchema = z.object({
  ...baseSignUpSchema,
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignUpFormData = DoctorSignUpData | PatientSignUpData;

export default function SignUpScreen() {
  const { colors } = useColorScheme();
  const { userType } = useLocalSearchParams<{ userType: 'doctor' | 'patient' }>();
  const { signup } = useAuth();
  const [formData, setFormData] = useState<SignUpFormData>({
    name: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    ...(userType === 'doctor' ? { specialization: '' } : {}),
  } as SignUpFormData);
  const [errors, setErrors] = useState<Partial<SignUpFormData>>({});
  const [isLoading, setIsLoading] = useState(false);

  const scale = useSharedValue(0.3);
  const opacity = useSharedValue(0);
  const formOpacity = useSharedValue(0);

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
  }, []);

  const validateField = (field: keyof SignUpFormData, value: string) => {
    try {
      const baseSchema = z.object(baseSignUpSchema);
      const fieldSchema = baseSchema.shape[field as keyof typeof baseSchema.shape];
      fieldSchema.parse(value);
      setErrors(prev => ({ ...prev, [field]: undefined }));
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors(prev => ({ ...prev, [field]: error.errors[0].message }));
      }
      return false;
    }
  };

  const validateSpecialization = (value: string) => {
    try {
      const specializationSchema = z.string().min(2, 'Please enter your specialization');
      specializationSchema.parse(value);
      setErrors(prev => ({ ...prev, specialization: undefined }));
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors(prev => ({ ...prev, specialization: error.errors[0].message }));
      }
      return false;
    }
  };

  const handleSignUp = async () => {
    setIsLoading(true);
    setErrors({}); // Clear previous errors
    
    try {
      const schema = userType === 'doctor' ? doctorSignUpSchema : patientSignUpSchema;
      const validatedData = schema.parse(formData);
      
      let signUpData;

      if(userType === 'doctor'){
        const doctorData = validatedData as DoctorSignUpData;
        signUpData = {
          email: doctorData.email,
          password: doctorData.password,
          name: doctorData.name,
          userType,
          phoneNumber: doctorData.phoneNumber,
          specialization: doctorData.specialization
        }
      } else {
        signUpData = {
          email: validatedData.email,
          password: validatedData.password,
          name: validatedData.name,
          userType,
          phoneNumber: validatedData.phoneNumber
        }
      }
      const result = await signup(signUpData.email,signUpData.password,signUpData.name,signUpData.userType,signUpData.phoneNumber,signUpData.specialization);
      console.log(signUpData);      
      if (result.error) {
        // Handle backend errors
        setErrors({
          email: result.error.message || 'An error occurred during sign up'
        });
      } else {
        // Successful signup - navigate to appropriate dashboard
        if(userType === 'doctor'){
          router.replace('/doctor/dashboard');
        } else {
          router.replace('/patient/dashboard');
        }
      }
    } catch (error) {
      console.log(error);

      if (error instanceof z.ZodError) {
        // Handle validation errors
        const newErrors: Partial<SignUpFormData> = {};
        error.errors.forEach(err => {
          const field = err.path[0] as keyof SignUpFormData;
          newErrors[field] = err.message;
        });
        setErrors(newErrors);
      } else {
        // Handle unexpected errors
        setErrors({
          email: error? error as string : 'An unexpected error occurred during sign up'
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = () => {
    router.push({
      pathname: '/startup/signin',
      params: { userType }
    });
  };

  const headerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: withSpring(opacity.value * 20) }],
  }));

  const formStyle = useAnimatedStyle(() => ({
    opacity: formOpacity.value,
    transform: [{ translateY: withSpring(formOpacity.value * 20) }],
  }));

  return (
    <ThemedView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.header, headerStyle]}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons 
              name={userType === 'doctor' ? 'doctor' : 'account-heart'} 
              size={40} 
              color={userType === 'doctor' ? colors.doctorPrimary : colors.patientPrimary}
            />
          </View>
          <ThemedText type="title" style={[styles.title, {color: userType === 'doctor' ? colors.doctorPrimary : colors.patientPrimary}]}>
            Create Account
          </ThemedText>
          <ThemedText style={[styles.subtitle, {color: colors.textLight}]}>
            Sign up as {userType}
          </ThemedText>
        </Animated.View>

        <Animated.View style={[styles.formContainer, formStyle]}>
          <View>
            <View style={[styles.inputContainer, errors.name && styles.errorText, { backgroundColor: colors.background,borderColor: colors.border }]}>
              <MaterialCommunityIcons name="account" size={24} color={colors.textLight} />
              <TextInput
                style={[styles.input, {color: colors.text}]}
                placeholder="Full Name"
                placeholderTextColor={colors.textLight}
                value={formData.name}
                onChangeText={(text) => {
                  setFormData(prev => ({ ...prev, name: text }));
                  validateField('name', text);
                }}
                autoCapitalize="words"
                editable={!isLoading}
              />
            </View>
            {errors.name && (
              <ThemedText style={[styles.errorText, {color: colors.error}]}>{errors.name}</ThemedText>
            )}
          </View>

          <View>
            <View style={[styles.inputContainer, errors.email && styles.errorText, { backgroundColor: colors.background,borderColor: colors.border }]}>
              <MaterialCommunityIcons name="email" size={24} color={colors.textLight} />
              <TextInput
                style={[styles.input, {color: colors.text}]}
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
              <ThemedText style={[styles.errorText, {color: colors.error}]}>{errors.email}</ThemedText>
            )}
          </View>

          <View>
            <View style={[styles.inputContainer, errors.phoneNumber && styles.errorText, { backgroundColor: colors.background,borderColor: colors.border }]}>
              <MaterialCommunityIcons name="phone" size={24} color={colors.textLight} />
              <TextInput
                style={[styles.input, {color: colors.text,backgroundColor: colors.background}]}
                placeholder="Phone Number"
                placeholderTextColor={colors.textLight}
                value={formData.phoneNumber}
                onChangeText={(text) => {
                  setFormData(prev => ({ ...prev, phoneNumber: text }));
                  validateField('phoneNumber', text);
                }}
                keyboardType="phone-pad"
                editable={!isLoading}
              />
            </View>
            {errors.phoneNumber && (
              <ThemedText style={[styles.errorText, {color: colors.error}]}>{errors.phoneNumber}</ThemedText>
            )}
          </View>

          {userType === 'doctor' && (
            <View>
              <View style={[styles.inputContainer, errors.specialization && styles.errorText, { backgroundColor: colors.background,borderColor: colors.border }]}>
                <MaterialCommunityIcons name="stethoscope" size={24} color={colors.textLight} />
                <TextInput
                  style={[styles.input, {color: colors.text,backgroundColor: colors.background}]}
                  placeholder="Specialization"
                  placeholderTextColor={colors.textLight}
                  value={formData.specialization}
                  onChangeText={(text) => {
                    setFormData(prev => ({ ...prev, specialization: text }));
                    validateSpecialization(text);
                  }}
                  autoCapitalize="words"
                  editable={!isLoading}
                />
              </View>
              {errors.specialization && (
                <ThemedText style={[styles.errorText, {color: colors.error}]}>{errors.specialization}</ThemedText>
              )}
            </View>
          )}

          <View>
            <View style={[styles.inputContainer, errors.password && styles.errorText, { backgroundColor: colors.background,borderColor: colors.border }]}>
              <MaterialCommunityIcons name="lock" size={24} color={colors.textLight} />
              <TextInput
                style={[styles.input, {color: colors.text,backgroundColor: colors.background}]}
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
              <ThemedText style={[styles.errorText, {color: colors.error}]}>{errors.password}</ThemedText>
            )}
          </View>

          <View>
            <View style={[styles.inputContainer, errors.confirmPassword && styles.errorText, { backgroundColor: colors.background,borderColor: colors.border }]}>
              <MaterialCommunityIcons name="lock-check" size={24} color={colors.textLight} />
              <TextInput
                style={[styles.input, {color: colors.text,backgroundColor: colors.background}]}
                placeholder="Confirm Password"
                placeholderTextColor={colors.textLight}
                value={formData.confirmPassword}
                onChangeText={(text) => {
                  setFormData(prev => ({ ...prev, confirmPassword: text }));
                  validateField('confirmPassword', text);
                }}
                secureTextEntry
                editable={!isLoading}
              />
            </View>
            {errors.confirmPassword && (
              <ThemedText style={[styles.errorText, {color: colors.error}]}>{errors.confirmPassword}</ThemedText>
            )}
          </View>

          <TouchableOpacity 
            style={[styles.signUpButton, isLoading && styles.signUpButtonDisabled, {backgroundColor: userType === 'doctor' ? colors.doctorPrimary : colors.patientPrimary}]}
            onPress={handleSignUp}
            disabled={isLoading}>
            <ThemedText style={[styles.signUpButtonText, {color: colors.background}]}>
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </ThemedText>
          </TouchableOpacity>

          <View style={styles.signInContainer}>
            <ThemedText style={[styles.signInText, {color: colors.textLight}]}>
              Already have an account?{' '}
            </ThemedText>
            <TouchableOpacity onPress={handleSignIn}>
              <ThemedText style={[styles.signInLink, {color: userType === 'doctor' ? colors.doctorPrimary : colors.patientPrimary}]}>
                Sign In
              </ThemedText>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
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
    paddingBottom: 40,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  signUpButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  signUpButtonDisabled: {
    opacity: 0.7,
  },
  signUpButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  signInText: {
    fontSize: 14,
  },
  signInLink: {
    fontSize: 14,
    fontWeight: '600',
  },
}); 