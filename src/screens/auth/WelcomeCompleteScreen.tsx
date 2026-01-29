import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { AuthButton } from '../../components/auth';
import { useAuth } from '../../contexts/AuthContext';
import { colors } from '../../theme';
import { AuthStackParamList } from '../../navigation/AuthNavigator';

type WelcomeCompleteScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'WelcomeComplete'>;
type WelcomeCompleteScreenRouteProp = RouteProp<AuthStackParamList, 'WelcomeComplete'>;

interface WelcomeCompleteScreenProps {
  navigation: WelcomeCompleteScreenNavigationProp;
  route: WelcomeCompleteScreenRouteProp;
}

export const WelcomeCompleteScreen: React.FC<WelcomeCompleteScreenProps> = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { signOut } = useAuth();
  const { nickname } = route.params;

  const handleBackToLogin = async () => {
    // Sign out to clear any partial session and go back to welcome
    await signOut();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Welcome' }],
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.content}>
          <Image
            source={require('../../../assets/mascotte.png')}
            style={styles.mascotte}
            resizeMode="contain"
          />
          <Text style={styles.title}>
            {t('auth.onboarding.welcomeComplete.title', { nickname })}
          </Text>
          <Text style={styles.subtitle}>
            {t('auth.onboarding.welcomeComplete.subtitle')}
          </Text>
          <View style={styles.spamHint}>
            <Ionicons name="mail-outline" size={16} color={colors.gray400} />
            <Text style={styles.spamText}>
              {t('auth.onboarding.welcomeComplete.checkSpam')}
            </Text>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <AuthButton
            title={t('auth.onboarding.welcomeComplete.backToLogin')}
            onPress={handleBackToLogin}
          />
        </View>
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
    paddingHorizontal: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mascotte: {
    width: 200,
    height: 173,
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Agdasima-Bold',
    color: colors.gray900,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: colors.gray500,
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 24,
  },
  spamHint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    gap: 6,
  },
  spamText: {
    fontSize: 14,
    color: colors.gray400,
  },
  buttonContainer: {
    paddingBottom: 40,
  },
});
