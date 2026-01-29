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
import { Ionicons } from '@expo/vector-icons';
import { AuthProgressBar, AuthInput, AuthButton } from '../../components/auth';
import { validateEmail, checkEmailExists } from '../../services/auth.service';
import { colors } from '../../theme';
import { AuthStackParamList } from '../../navigation/AuthNavigator';

type EmailScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Email'>;

interface EmailScreenProps {
  navigation: EmailScreenNavigationProp;
}

export const EmailScreen: React.FC<EmailScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        return;
      }

      if (exists) {
        // Existing user - go to password login
        navigation.navigate('PasswordLogin', { email: email.trim() });
      } else {
        // New user - go to nickname screen
        navigation.navigate('Nickname', { email: email.trim() });
      }
    } catch (err) {
      setError(t('auth.onboarding.errors.emailCheckFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <AuthProgressBar currentStep={1} totalSteps={3} />

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

        <View style={styles.buttonContainer}>
          <AuthButton
            title={isLoading ? t('auth.onboarding.email.checking') : t('auth.onboarding.email.continue')}
            onPress={handleContinue}
            loading={isLoading}
            disabled={!email.trim()}
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
    marginBottom: 32,
    textAlign: 'center',
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
});
