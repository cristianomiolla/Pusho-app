import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { AuthProgressBar, AuthInput, AuthButton } from '../../components/auth';
import { validateEmail, checkEmailExists } from '../../services/auth.service';
import { useKeyboardHeight } from '../../hooks/useKeyboardHeight';
import { colors } from '../../theme';
import { AuthStackParamList } from '../../navigation/AuthNavigator';

type EmailScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Email'>;

interface EmailScreenProps {
  navigation: EmailScreenNavigationProp;
}

export const EmailScreen: React.FC<EmailScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const { buttonContainerStyle } = useKeyboardHeight();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pendingNavigation = useRef<{ screen: 'PasswordLogin' | 'Nickname'; email: string } | null>(null);

  // Logo animation
  const logoScale = useSharedValue(1);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
  }));

  const triggerLogoAnimation = (onComplete: () => void) => {
    logoScale.value = withSequence(
      withTiming(1.12, { duration: 220, easing: Easing.out(Easing.ease) }),
      withTiming(1, { duration: 220, easing: Easing.inOut(Easing.ease) })
    );
    setTimeout(onComplete, 460);
  };

  const handleContinue = async () => {
    setError(null);

    // Validate email format
    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }

    setIsLoading(true);

    try {
      const { exists, error: checkError } = await checkEmailExists(email.trim());

      if (checkError) {
        setError(t('auth.onboarding.errors.emailCheckFailed'));
        setIsLoading(false);
        return;
      }

      // Store navigation target and trigger animation
      pendingNavigation.current = {
        screen: exists ? 'PasswordLogin' : 'Nickname',
        email: email.trim(),
      };

      triggerLogoAnimation(() => {
        if (pendingNavigation.current) {
          navigation.navigate(pendingNavigation.current.screen, {
            email: pendingNavigation.current.email,
          });
          pendingNavigation.current = null;
        }
        setIsLoading(false);
      });
    } catch (err) {
      setError(t('auth.onboarding.errors.emailCheckFailed'));
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <AuthProgressBar currentStep={1} totalSteps={3} onBack={() => navigation.goBack()} />

      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <Animated.Image
              source={require('../../../assets/nobackground.png')}
              style={[styles.logo, logoAnimatedStyle]}
              resizeMode="contain"
            />

            <Text style={styles.title}>{t('auth.onboarding.email.title')}</Text>

            <AuthInput
              placeholder={t('auth.onboarding.email.placeholder')}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              autoComplete="email"
              editable={!isLoading}
              error={error || undefined}
            />
          </View>
        </ScrollView>

        <Animated.View style={[styles.buttonContainer, buttonContainerStyle]}>
          <AuthButton
            title={isLoading ? t('auth.onboarding.email.checking') : t('auth.onboarding.email.continue')}
            onPress={handleContinue}
            loading={isLoading}
            disabled={!email.trim()}
          />
        </Animated.View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    alignSelf: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Agdasima-Bold',
    color: colors.gray900,
    marginBottom: 32,
    textAlign: 'center',
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
});
