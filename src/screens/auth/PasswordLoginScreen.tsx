import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { AuthProgressBar, AuthInput, AuthButton } from '../../components/auth';
import { useAuth } from '../../contexts/AuthContext';
import { translateAuthError } from '../../services/auth.service';
import { useKeyboardHeight } from '../../hooks/useKeyboardHeight';
import { colors } from '../../theme';
import { AuthStackParamList } from '../../navigation/AuthNavigator';

type PasswordLoginScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'PasswordLogin'>;
type PasswordLoginScreenRouteProp = RouteProp<AuthStackParamList, 'PasswordLogin'>;

interface PasswordLoginScreenProps {
  navigation: PasswordLoginScreenNavigationProp;
  route: PasswordLoginScreenRouteProp;
}

export const PasswordLoginScreen: React.FC<PasswordLoginScreenProps> = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { buttonContainerStyle } = useKeyboardHeight();
  const { signIn } = useAuth();
  const { email } = route.params;

  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleLogin = async () => {
    setError(null);

    if (!password) {
      setError(t('auth.validation.passwordRequired'));
      return;
    }

    setIsLoading(true);

    // Trigger animation first, then sign in after animation completes
    triggerLogoAnimation(async () => {
      try {
        const { error } = await signIn(email, password);

        if (error) {
          setError(translateAuthError(error));
          setIsLoading(false);
        }
        // Success - AuthContext handles navigation
      } catch (err) {
        setError(t('auth.errors.genericError'));
        setIsLoading(false);
      }
    });
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword', { email });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <AuthProgressBar currentStep={2} totalSteps={2} onBack={() => navigation.goBack()} />

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

            <Text style={styles.title}>{t('auth.onboarding.passwordLogin.title')}</Text>
            <Text style={styles.subtitle}>{t('auth.onboarding.passwordLogin.subtitle')}</Text>

            <AuthInput
              placeholder={t('auth.passwordPlaceholder')}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
              error={error || undefined}
            />

            <TouchableOpacity
              style={styles.forgotButton}
              onPress={handleForgotPassword}
              disabled={isLoading}
            >
              <Text style={styles.forgotText}>{t('auth.forgotPassword')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <Animated.View style={[styles.buttonContainer, buttonContainerStyle]}>
          <AuthButton
            title={t('auth.onboarding.passwordLogin.login')}
            onPress={handleLogin}
            loading={isLoading}
            disabled={!password}
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
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.gray500,
    marginBottom: 32,
    textAlign: 'center',
  },
  forgotButton: {
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  forgotText: {
    fontSize: 14,
    color: colors.gray900,
    fontWeight: '500',
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
});
