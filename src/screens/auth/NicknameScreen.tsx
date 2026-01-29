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
import { validateNickname, checkNicknameAvailable } from '../../services/auth.service';
import { useKeyboardHeight } from '../../hooks/useKeyboardHeight';
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
  const { buttonContainerStyle } = useKeyboardHeight();
  const { email } = route.params;
  const [nickname, setNickname] = useState('');
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
        setIsLoading(false);
        return;
      }

      triggerLogoAnimation(() => {
        navigation.navigate('CreatePassword', { email, nickname: nickname.trim() });
        setIsLoading(false);
      });
    } catch (err) {
      setError(t('auth.errors.genericError'));
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <AuthProgressBar currentStep={2} totalSteps={3} />

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

        <Animated.View style={[styles.buttonContainer, buttonContainerStyle]}>
          <AuthButton
            title={t('auth.onboarding.nickname.continue')}
            onPress={handleContinue}
            loading={isLoading}
            disabled={!nickname.trim()}
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
  buttonContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
});
