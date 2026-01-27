import React, { useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWindowDimensions, Platform, TouchableOpacity, StyleSheet, View, BackHandler } from 'react-native';
import { PushupDetectionScreen } from '../screens/PushupDetectionScreen';
import { AllenamentiScreen } from '../screens/AllenamentiScreen';
import { CommunityScreen } from '../screens/CommunityScreen';
import { useWorkout } from '../contexts/WorkoutContext';

const Tab = createBottomTabNavigator();

const CustomTabBarButton = ({ children, onPress, focused, isCTA }: any) => (
  <TouchableOpacity
    onPress={onPress}
    style={[
      styles.tabButton,
      focused && styles.tabButtonFocused,
      isCTA && styles.ctaButton,
    ]}
    activeOpacity={0.7}
  >
    <View style={[
      styles.iconContainer,
      isCTA && styles.ctaIconContainer,
    ]}>
      {children}
    </View>
  </TouchableOpacity>
);

export const MainNavigator = () => {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const { isGuidedWorkoutActive } = useWorkout();

  // Blocca il tasto back hardware di Android quando l'allenamento è attivo
  useEffect(() => {
    if (!isGuidedWorkoutActive) return;

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // Ritorna true per indicare che abbiamo gestito l'evento (blocca il back)
      return true;
    });

    return () => backHandler.remove();
  }, [isGuidedWorkoutActive]);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: (isLandscape || isGuidedWorkoutActive) ? { display: 'none' } : {
          position: 'absolute',
          backgroundColor: '#1C1C1E',
          borderTopWidth: 0,
          elevation: 0,
          height: 80,
          paddingBottom: 10,
          paddingTop: 10,
          marginHorizontal: 20,
          marginBottom: insets.bottom > 0 ? insets.bottom : 10,
          borderRadius: 40,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.3,
          shadowRadius: 20,
          ...Platform.select({
            android: {
              elevation: 8,
            },
          }),
        },
        tabBarShowLabel: false,
        tabBarButton: (props) => <CustomTabBarButton {...props} focused={props.accessibilityState?.selected} isCTA={route.name === 'Start'} />,
        tabBarIcon: ({ focused }) => {
          const iconColor = focused ? '#FFFFFF' : '#666666';

          if (route.name === 'Allenamenti') {
            return <MaterialCommunityIcons name="home" size={26} color={iconColor} />;
          } else if (route.name === 'Start') {
            return (
              <View style={{ width: 34, height: 34, justifyContent: 'center', alignItems: 'center' }}>
                <MaterialCommunityIcons name="arm-flex" size={34} color="#000000" />
              </View>
            );
          } else if (route.name === 'Community') {
            return <MaterialCommunityIcons name="earth" size={26} color={iconColor} />;
          }

          return <MaterialCommunityIcons name="home" size={24} color={iconColor} />;
        },
      })}
    >
      <Tab.Screen
        name="Allenamenti"
        component={AllenamentiScreen}
      />
      <Tab.Screen
        name="Start"
        component={PushupDetectionScreen}
      />
      <Tab.Screen
        name="Community"
        component={CommunityScreen}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabButtonFocused: {
    // Stile aggiuntivo per tab attivo (opzionale)
  },
  ctaButton: {
    marginTop: -25, // Alza il bottone CTA
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2C2C2E',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    ...Platform.select({
      android: {
        elevation: 4,
      },
    }),
  },
  ctaIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#BDEEE7',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
    shadowColor: '#BDEEE7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    ...Platform.select({
      android: {
        elevation: 12,
      },
    }),
  },
});
