import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import {
  validateEmail,
  sendPasswordResetEmail,
  translateAuthError,
} from '../../services/auth.service';
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
  const initialEmail = route.params?.email || '';
  const [email, setEmail] = useState(initialEmail);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const handleResetPassword = async () => {
    // Reset errors
    setError(null);
    setFieldError(null);

    // Validate email
    const emailError = validateEmail(email);
    if (emailError) {
      setFieldError(emailError);
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await sendPasswordResetEmail(email.trim());

      if (error) {
        setError(translateAuthError(error));
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError(t('auth.errors.genericError'));
    } finally {
      setIsLoading(false);
    }
  };

  // Success screen
  if (success) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.successContainer}>
          <Text style={styles.successEmoji}>📧</Text>
          <Text style={styles.successTitle}>{t('auth.resetEmailSentTitle')}</Text>
          <Text style={styles.successText}>
            {t('auth.resetEmailSentText')}{'\n'}
            <Text style={styles.successEmail}>{email}</Text>
          </Text>
          <Text style={styles.successSubtext}>
            {t('auth.resetEmailSentSubtext')}
          </Text>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>{t('auth.backToLogin')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back button */}
          <TouchableOpacity
            style={styles.backArrow}
            onPress={() => navigation.goBack()}
            disabled={isLoading}
          >
            <Text style={styles.backArrowText}>← {t('auth.back')}</Text>
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{t('auth.forgotPasswordTitle')}</Text>
            <Text style={styles.subtitle}>
              {t('auth.forgotPasswordSubtitle')}
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Email */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('auth.email')}</Text>
              <TextInput
                style={[styles.input, fieldError && styles.inputError]}
                placeholder={t('auth.emailPlaceholder')}
                placeholderTextColor={colors.gray400}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                editable={!isLoading}
              />
              {fieldError && <Text style={styles.fieldError}>{fieldError}</Text>}
            </View>

            {/* Error message */}
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Reset Button */}
            <TouchableOpacity
              style={[styles.resetButton, isLoading && styles.resetButtonDisabled]}
              onPress={handleResetPassword}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.resetButtonText}>{t('auth.sendInstructions')}</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
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
    paddingTop: 20,
    paddingBottom: 40,
  },
  backArrow: {
    marginBottom: 32,
  },
  backArrowText: {
    fontSize: 16,
    color: colors.link,
    fontWeight: '500',
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.gray900,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: colors.gray500,
    lineHeight: 24,
  },
  form: {
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray700,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.gray900,
    borderWidth: 1,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  inputError: {
    borderColor: colors.error,
  },
  fieldError: {
    fontSize: 12,
    color: colors.error,
    marginTop: 4,
  },
  errorContainer: {
    backgroundColor: colors.errorLight,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    color: colors.errorText,
    textAlign: 'center',
  },
  resetButton: {
    backgroundColor: colors.gray900,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  resetButtonDisabled: {
    opacity: 0.7,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  // Success screen styles
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  successEmoji: {
    fontSize: 64,
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
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
    fontWeight: '600',
    color: colors.gray900,
  },
  successSubtext: {
    fontSize: 14,
    color: colors.gray400,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  backButton: {
    backgroundColor: colors.gray900,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
});
