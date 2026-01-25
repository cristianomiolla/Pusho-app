import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';
import { WorkoutProvider } from './src/contexts/WorkoutContext';
import { AuthProvider } from './src/contexts/AuthContext';
import * as Font from 'expo-font';
import { View, ActivityIndicator } from 'react-native';
import './src/i18n';

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      await Font.loadAsync({
        'Agdasima-Regular': require('./assets/fonts/Agdasima-Regular.ttf'),
        'Agdasima-Bold': require('./assets/fonts/Agdasima-Bold.ttf'),
      });
      setFontsLoaded(true);
    }
    loadFonts();
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color="#BDEEE7" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <WorkoutProvider>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </WorkoutProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
