import { useEffect } from 'react';
import { Keyboard, Platform, KeyboardEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const BUTTON_KEYBOARD_GAP = 24; // Spazio tra bottone e tastiera
const DEFAULT_BOTTOM_PADDING = 40; // Padding bottom quando tastiera è chiusa

export const useKeyboardHeight = () => {
  const insets = useSafeAreaInsets();
  const keyboardHeight = useSharedValue(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onKeyboardShow = (event: KeyboardEvent) => {
      const height = event.endCoordinates.height;
      const duration = Platform.OS === 'ios' ? event.duration : 250;

      keyboardHeight.value = withTiming(height, {
        duration,
        easing: Easing.out(Easing.ease),
      });
    };

    const onKeyboardHide = (event: KeyboardEvent) => {
      const duration = Platform.OS === 'ios' ? event.duration : 250;

      keyboardHeight.value = withTiming(0, {
        duration,
        easing: Easing.out(Easing.ease),
      });
    };

    const showSubscription = Keyboard.addListener(showEvent, onKeyboardShow);
    const hideSubscription = Keyboard.addListener(hideEvent, onKeyboardHide);

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [keyboardHeight]);

  const buttonContainerStyle = useAnimatedStyle(() => {
    if (keyboardHeight.value > 0) {
      // Tastiera aperta: altezza tastiera - safe area bottom (già gestita da SafeAreaView) + gap
      const padding = keyboardHeight.value - insets.bottom + BUTTON_KEYBOARD_GAP;
      return { paddingBottom: padding };
    }
    return { paddingBottom: DEFAULT_BOTTOM_PADDING };
  });

  return { keyboardHeight, buttonContainerStyle };
};
