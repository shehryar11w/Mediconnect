import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Dimensions, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';

const { width } = Dimensions.get('window');

export default function OnboardingScreen() {
  const { colors} = useColorScheme();

  const scale = useSharedValue(0.3);
  const opacity = useSharedValue(0);
  const optionsOpacity = useSharedValue(0);

  useEffect(() => {
    // Animate logo
    scale.value = withSpring(1, {
      damping: 8,
      stiffness: 100,
    });

    // Animate title
    opacity.value = withSequence(
      withDelay(300, withTiming(1, { duration: 800 }))
    );

    // Animate options
    optionsOpacity.value = withSequence(
      withDelay(600, withTiming(1, { duration: 800 }))
    );
  }, []);

  const handleUserTypeSelect = (type: 'doctor' | 'patient') => {
    // TODO: Store user type in state management
    router.replace(`/startup/signin?userType=${type}` as any);
  };

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const headerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: withSpring(opacity.value * 20) }],
  }));

  const optionsStyle = useAnimatedStyle(() => ({
    opacity: optionsOpacity.value,
    transform: [{ translateY: withSpring(optionsOpacity.value * 20) }],
  }));

  return (
    <ThemedView style={styles.container}>
      <Animated.View style={[styles.header, headerStyle]}>
        <Animated.View style={[styles.logoContainer, logoStyle]}>
          <Image
            source={require('@/assets/images/icon.png')}
            style={styles.logo}
            contentFit="contain"
          />
        </Animated.View>
        <ThemedText type="title" style={[styles.title, { color: colors.red }]}>
          Welcome to MediConnect
        </ThemedText>
        <ThemedText style={[styles.subtitle, { color: colors.textLight }]}>
          Please select your role to continue
        </ThemedText>
      </Animated.View>

      <Animated.View style={[styles.optionsContainer, optionsStyle]}>
        <TouchableOpacity
          style={[styles.option,{borderColor: colors.border}]}
          onPress={() => handleUserTypeSelect('doctor')}>
          <View style={[styles.optionContent, { backgroundColor: colors.background}]}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons 
                name="doctor" 
                size={32} 
                color={colors.doctorPrimary}
              />
            </View>
            <ThemedText type="subtitle" style={[styles.optionTitle, { color: colors.text}]}>
              I am a Doctor
            </ThemedText>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.option,{borderColor: colors.border}]}
          onPress={() => handleUserTypeSelect('patient')}>
          <View style={[styles.optionContent, { backgroundColor: colors.background}]}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons 
                name="account-heart" 
                size={32} 
                color={colors.patientPrimary}
              />
            </View>
            <ThemedText type="subtitle" style={[styles.optionTitle, { color: colors.text }]}>
              I am a Patient
            </ThemedText>
          </View>
        </TouchableOpacity>
      </Animated.View>
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
  logoContainer: {
    width: width * 0.25,
    height: width * 0.25,
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 0.5,
    fontFamily: 'SpaceMono-Regular',
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.8,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  optionsContainer: {
    gap: 16,
  },
  option: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  optionContent: {
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
}); 