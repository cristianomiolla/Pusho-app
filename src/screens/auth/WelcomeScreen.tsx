import React, { useEffect } from 'react';
import { View, Text, Image, StyleSheet, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { AuthButton } from '../../components/auth';
import { colors } from '../../theme';
import { AuthStackParamList } from '../../navigation/AuthNavigator';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type WelcomeScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Welcome'>;

interface WelcomeScreenProps {
  navigation: WelcomeScreenNavigationProp;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  // Animation for logo bounce from bottom
  const logoTranslateY = useSharedValue(300);
  // Animation for bottom content fade in and slide up
  const contentOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(30);

  useEffect(() => {
    logoTranslateY.value = withSpring(0, {
      damping: 8,
      stiffness: 120,
      mass: 0.8,
    });

    // Start content animation after logo animation (~400ms delay)
    contentOpacity.value = withDelay(
      400,
      withTiming(1, {
        duration: 300,
        easing: Easing.out(Easing.ease),
      })
    );
    contentTranslateY.value = withDelay(
      400,
      withTiming(0, {
        duration: 300,
        easing: Easing.out(Easing.ease),
      })
    );
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: logoTranslateY.value }],
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentTranslateY.value }],
  }));

  const handleGetStarted = () => {
    navigation.navigate('Email');
  };

  return (
    <View style={styles.container}>
      {/* Top dark section with logo */}
      <View style={[styles.topSection, { paddingTop: insets.top }]}>
        <View style={styles.logoContainer}>
          <Animated.Image
            source={require('../../../assets/nobackground.png')}
            style={[styles.logo, logoAnimatedStyle]}
            resizeMode="contain"
          />
        </View>
      </View>

      {/* Bottom light section with text and button */}
      <View style={[styles.bottomSection, { paddingBottom: insets.bottom }]}>
        <Animated.View style={[styles.textContainer, contentAnimatedStyle]}>
          <Text style={styles.title}>PUSHO</Text>
          <Text style={styles.tagline}>{t('auth.onboarding.welcome.tagline')}</Text>
        </Animated.View>

        <Animated.View style={[styles.buttonContainer, contentAnimatedStyle]}>
          <AuthButton
            title={t('auth.onboarding.welcome.getStarted')}
            onPress={handleGetStarted}
          />
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray900,
  },
  topSection: {
    flex: 1,
    backgroundColor: colors.gray900,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 200,
    height: 200,
  },
  bottomSection: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 24,
    minHeight: SCREEN_HEIGHT * 0.40,
  },
  textContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 48,
    fontFamily: 'Agdasima-Bold',
    color: colors.gray900,
    letterSpacing: 4,
    marginBottom: 12,
  },
  tagline: {
    fontSize: 16,
    color: colors.gray500,
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 24,
  },
  buttonContainer: {
    paddingBottom: 40,
  },
});
