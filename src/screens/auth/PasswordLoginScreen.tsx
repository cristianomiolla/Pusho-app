import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { AuthProgressBar, AuthInput, AuthButton } from '../../components/auth';
import { useAuth } from '../../contexts/AuthContext';
import { translateAuthError } from '../../services/auth.service';
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
  const { signIn } = useAuth();
  const { email } = route.params;

  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setError(null);

    if (!password) {
      setError(t('auth.validation.passwordRequired'));
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await signIn(email, password);

      if (error) {
        setError(translateAuthError(error));
      }
      // If success, AuthContext will handle navigation to MainApp
    } catch (err) {
      setError(t('auth.errors.genericError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword', { email });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <AuthProgressBar currentStep={2} totalSteps={2} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
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
            <Image
              source={require('../../../assets/nobackground.png')}
              style={styles.logo}
              resizeMode="contain"
            />

            <Text style={styles.title}>{t('auth.onboarding.passwordLogin.title')}</Text>
            <Text style={styles.emailText}>{email}</Text>
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

        <View style={styles.buttonContainer}>
          <AuthButton
            title={t('auth.onboarding.passwordLogin.login')}
            onPress={handleLogin}
            loading={isLoading}
            disabled={!password}
          />
        </View>
      </KeyboardAvoidingView>
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
  emailText: {
    fontSize: 16,
    color: colors.gray700,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: colors.gray500,
    marginBottom: 32,
    textAlign: 'center',
  },
  forgotButton: {
    alignSelf: 'center',
    marginTop: -8,
    marginBottom: 24,
  },
  forgotText: {
    fontSize: 14,
    color: colors.gray900,
    fontWeight: '500',
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
});
