import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming
} from 'react-native-reanimated';

import { ThemedText } from '@/components/ThemedText';
import { useColorScheme } from '../hooks/useColorScheme';
import { createGlobalStyles } from './theme/styles';

const { width } = Dimensions.get('window');

export default function SplashScreen() {
  const { colors} = useColorScheme();
  const globalStyles = createGlobalStyles(colors);
  const scale = useSharedValue(0.3);
  const opacity = useSharedValue(0);
  const subtitleOpacity = useSharedValue(0);

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

    // Animate subtitle
    subtitleOpacity.value = withSequence(
      withDelay(600, withTiming(1, { duration: 800 }))
    );

    // Navigate to onboarding after 2.5 seconds
    const timer = setTimeout(() => {
      router.replace('/startup/onboarding');
    }, 2500);

    return () => clearTimeout(timer);
  }, [opacity, scale, subtitleOpacity]);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: withSpring(opacity.value * 20) }],
  }));

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
    transform: [{ translateY: withSpring(subtitleOpacity.value * 20) }],
  }));

  return (
    <View style={[globalStyles.container, styles.container]}>
      <Animated.View style={[styles.logoContainer, logoStyle]}>
        <Image
          source={require('@/assets/images/icon.png')}
          style={styles.logo}
          contentFit="contain"
        />
      </Animated.View>
      
      <Animated.View style={titleStyle}>
        <ThemedText type="title" style={[styles.title, { color: colors.doctorPrimary }]}>
          MediConnect
        </ThemedText>
      </Animated.View>

      <Animated.View style={subtitleStyle}>
        <ThemedText style={[styles.subtitle, { color: colors.textLight }]}>
          Connecting Doctors and Patients
        </ThemedText>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    width: width * 0.4,
    height: width * 0.4,
    marginBottom: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 200,
    height: 200,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 18,
    opacity: 0.8,
    letterSpacing: 0.3,
  },
}); 