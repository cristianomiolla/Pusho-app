import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthButton } from '../../components/auth';
import { colors } from '../../theme';
import { AuthStackParamList } from '../../navigation/AuthNavigator';

type WelcomeScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Welcome'>;

interface WelcomeScreenProps {
  navigation: WelcomeScreenNavigationProp;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();

  const handleGetStarted = () => {
    navigation.navigate('Email');
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
          <Text style={styles.logo}>PUSHO</Text>
          <Text style={styles.tagline}>{t('auth.onboarding.welcome.tagline')}</Text>
        </View>

        <View style={styles.buttonContainer}>
          <AuthButton
            title={t('auth.onboarding.welcome.getStarted')}
            onPress={handleGetStarted}
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
    marginBottom: 24,
  },
  logo: {
    fontSize: 48,
    fontFamily: 'Agdasima-Bold',
    color: colors.gray900,
    letterSpacing: 4,
    marginBottom: 12,
  },
  tagline: {
    fontSize: 16,
    color: colors.gray500,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  buttonContainer: {
    paddingBottom: 40,
  },
});
