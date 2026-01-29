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
import { validateNickname, checkNicknameAvailable } from '../../services/auth.service';
import { colors } from '../../theme';
import { AuthStackParamList } from '../../navigation/AuthNavigator';

type NicknameScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Nickname'>;
type NicknameScreenRouteProp = RouteProp<AuthStackParamList, 'Nickname'>;

interface NicknameScreenProps {
  navigation: NicknameScreenNavigationProp;
  route: NicknameScreenRouteProp;
}

export const NicknameScreen: React.FC<NicknameScreenProps> = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { email } = route.params;
  const [nickname, setNickname] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleContinue = async () => {
    setError(null);

    // Validate nickname format
    const nicknameError = validateNickname(nickname);
    if (nicknameError) {
      setError(nicknameError);
      return;
    }

    setIsLoading(true);

    try {
      // Check if nickname is available
      const isAvailable = await checkNicknameAvailable(nickname.trim());

      if (!isAvailable) {
        setError(t('auth.validation.nicknameTaken'));
        return;
      }

      navigation.navigate('CreatePassword', { email, nickname: nickname.trim() });
    } catch (err) {
      setError(t('auth.errors.genericError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <AuthProgressBar currentStep={2} totalSteps={3} />

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

            <Text style={styles.title}>{t('auth.onboarding.nickname.title')}</Text>
            <Text style={styles.subtitle}>{t('auth.onboarding.nickname.subtitle')}</Text>

            <AuthInput
              placeholder={t('auth.onboarding.nickname.placeholder')}
              value={nickname}
              onChangeText={setNickname}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={20}
              editable={!isLoading}
              error={error || undefined}
            />
          </View>
        </ScrollView>

        <View style={styles.buttonContainer}>
          <AuthButton
            title={t('auth.onboarding.nickname.continue')}
            onPress={handleContinue}
            loading={isLoading}
            disabled={!nickname.trim()}
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
  subtitle: {
    fontSize: 16,
    color: colors.gray500,
    marginBottom: 32,
    textAlign: 'center',
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
});
