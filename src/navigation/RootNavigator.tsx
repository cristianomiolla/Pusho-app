import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { ResetPasswordScreen } from '../screens/auth';
import { colors } from '../theme';

export const RootNavigator = () => {
  const { user, isLoading, pendingPasswordReset, clearPasswordReset } = useAuth();

  // Show loading screen while checking auth state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.gray900} />
      </View>
    );
  }

  // Show reset password screen if user came from password reset link
  if (user && pendingPasswordReset) {
    return <ResetPasswordScreen onPasswordReset={clearPasswordReset} />;
  }

  // Show auth screens if not logged in, main app if logged in
  return user ? <MainNavigator /> : <AuthNavigator />;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
