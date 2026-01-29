import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { AuthInput, AuthButton } from '../../components/auth';
import {
  validateEmail,
  sendPasswordResetEmail,
  translateAuthError,
} from '../../services/auth.service';
import { useKeyboardHeight } from '../../hooks/useKeyboardHeight';
import { colors } from '../../theme';
import { AuthStackParamList } from '../../navigation/AuthNavigator';

type ForgotPasswordScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>;
type ForgotPasswordScreenRouteProp = RouteProp<AuthStackParamList, 'ForgotPassword'>;

interface ForgotPasswordScreenProps {
  navigation: ForgotPasswordScreenNavigationProp;
  route: ForgotPasswordScreenRouteProp;
}

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({
  navigation,
  route,
}) => {
  const { t } = useTranslation();
  const { buttonContainerStyle } = useKeyboardHeight();
  const initialEmail = route.params?.email || '';
  const [email, setEmail] = useState(initialEmail);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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

  const handleResetPassword = async () => {
    setError(null);

    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }

    setIsLoading(true);

    // Trigger animation first, then send email
    triggerLogoAnimation(async () => {
      try {
        const { error } = await sendPasswordResetEmail(email.trim());

        if (error) {
          setError(translateAuthError(error));
          setIsLoading(false);
        } else {
          setSuccess(true);
          setIsLoading(false);
        }
      } catch (err) {
        setError(t('auth.errors.genericError'));
        setIsLoading(false);
      }
    });
  };

  // Success screen
  if (success) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.successContainer}>
          <Image
            source={require('../../../assets/nobackground.png')}
            style={styles.successLogo}
            resizeMode="contain"
          />
          <Text style={styles.successTitle}>{t('auth.resetEmailSentTitle')}</Text>
          <Text style={styles.successText}>
            {t('auth.resetEmailSentText')}
          </Text>
          <Text style={styles.successEmail}>{email}</Text>
          <Text style={styles.successSubtext}>
            {t('auth.resetEmailSentSubtext')}
          </Text>
          <View style={styles.successButtonContainer}>
            <AuthButton
              title={t('auth.backToLogin')}
              onPress={() => navigation.goBack()}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            disabled={isLoading}
          >
            <Ionicons name="arrow-back" size={24} color={colors.gray900} />
          </TouchableOpacity>

          <View style={styles.content}>
            <Animated.Image
              source={require('../../../assets/nobackground.png')}
              style={[styles.logo, logoAnimatedStyle]}
              resizeMode="contain"
            />

            <Text style={styles.title}>{t('auth.forgotPasswordTitle')}</Text>
            <Text style={styles.subtitle}>{t('auth.forgotPasswordSubtitle')}</Text>

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
            title={t('auth.sendInstructions')}
            onPress={handleResetPassword}
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
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginBottom: 16,
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
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.gray500,
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  // Success screen styles
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  successLogo: {
    width: 120,
    height: 120,
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 28,
    fontFamily: 'Agdasima-Bold',
    color: colors.gray900,
    marginBottom: 16,
    textAlign: 'center',
  },
  successText: {
    fontSize: 16,
    color: colors.gray500,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 24,
  },
  successEmail: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray900,
    marginBottom: 8,
    textAlign: 'center',
  },
  successSubtext: {
    fontSize: 14,
    color: colors.gray400,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  successButtonContainer: {
    width: '100%',
    paddingHorizontal: 24,
  },
});
