import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  WelcomeScreen,
  EmailScreen,
  PasswordLoginScreen,
  NicknameScreen,
  CreatePasswordScreen,
  WelcomeCompleteScreen,
  ForgotPasswordScreen,
  ResetPasswordScreen,
} from '../screens/auth';
import { colors } from '../theme';

export type AuthStackParamList = {
  Welcome: undefined;
  Email: undefined;
  PasswordLogin: { email: string };
  Nickname: { email: string };
  CreatePassword: { email: string; nickname: string };
  WelcomeComplete: { nickname: string };
  ForgotPassword: { email?: string };
  ResetPassword: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export const AuthNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}
      initialRouteName="Welcome"
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Email" component={EmailScreen} />
      <Stack.Screen name="PasswordLogin" component={PasswordLoginScreen} />
      <Stack.Screen name="Nickname" component={NicknameScreen} />
      <Stack.Screen name="CreatePassword" component={CreatePasswordScreen} />
      <Stack.Screen name="WelcomeComplete" component={WelcomeCompleteScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
    </Stack.Navigator>
  );
};
