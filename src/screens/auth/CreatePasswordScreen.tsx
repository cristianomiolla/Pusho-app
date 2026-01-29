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
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { AuthProgressBar, AuthInput, AuthButton } from '../../components/auth';
import { useAuth } from '../../contexts/AuthContext';
import {
  validatePassword,
  validateConfirmPassword,
  translateAuthError,
} from '../../services/auth.service';
import { useKeyboardHeight } from '../../hooks/useKeyboardHeight';
import { colors } from '../../theme';
import { AuthStackParamList } from '../../navigation/AuthNavigator';

type CreatePasswordScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'CreatePassword'>;
type CreatePasswordScreenRouteProp = RouteProp<AuthStackParamList, 'CreatePassword'>;

interface CreatePasswordScreenProps {
  navigation: CreatePasswordScreenNavigationProp;
  route: CreatePasswordScreenRouteProp;
}

export const CreatePasswordScreen: React.FC<CreatePasswordScreenProps> = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { buttonContainerStyle } = useKeyboardHeight();
  const { signUp } = useAuth();
  const { email, nickname } = route.params;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    password?: string;
    confirmPassword?: string;
  }>({});

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

  const handleCreateAccount = async () => {
    setError(null);
    setFieldErrors({});

    // Validate password
    const passwordError = validatePassword(password);
    const confirmError = validateConfirmPassword(password, confirmPassword);

    if (passwordError || confirmError) {
      setFieldErrors({
        password: passwordError || undefined,
        confirmPassword: confirmError || undefined,
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await signUp(email, password, nickname);

      if (error) {
        setError(translateAuthError(error));
        setIsLoading(false);
        return;
      }

      // Success - trigger animation then navigate
      triggerLogoAnimation(() => {
        navigation.navigate('WelcomeComplete', { nickname });
        setIsLoading(false);
      });
    } catch (err) {
      setError(t('auth.errors.genericError'));
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <AuthProgressBar currentStep={3} totalSteps={3} />

      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.gray900} />
          </TouchableOpacity>

          <View style={styles.content}>
            <Animated.Image
              source={require('../../../assets/nobackground.png')}
              style={[styles.logo, logoAnimatedStyle]}
              resizeMode="contain"
            />

            <Text style={styles.title}>{t('auth.onboarding.createPassword.title')}</Text>
            <Text style={styles.subtitle}>{t('auth.onboarding.createPassword.subtitle')}</Text>

            <AuthInput
              placeholder={t('auth.onboarding.createPassword.placeholder')}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
              error={fieldErrors.password}
            />

            <AuthInput
              placeholder={t('auth.onboarding.createPassword.confirmPlaceholder')}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
              error={fieldErrors.confirmPassword}
            />

            <Text style={styles.hint}>{t('auth.onboarding.createPassword.hint')}</Text>

            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
          </View>
        </ScrollView>

        <Animated.View style={[styles.buttonContainer, buttonContainerStyle]}>
          <AuthButton
            title={t('auth.onboarding.createPassword.createAccount')}
            onPress={handleCreateAccount}
            loading={isLoading}
            disabled={!password || !confirmPassword}
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
  },
  hint: {
    fontSize: 12,
    color: colors.gray400,
    marginBottom: 24,
    lineHeight: 18,
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: colors.transparent.error10,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    color: colors.error,
    textAlign: 'center',
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
});
