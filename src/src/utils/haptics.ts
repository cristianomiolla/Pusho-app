import { Platform, Vibration } from 'react-native';
import * as ExpoHaptics from 'expo-haptics';

/**
 * Cross-platform haptic feedback utility
 * Su iOS usa expo-haptics per feedback leggeri
 * Su Android usa Vibration con durata personalizzata
 */

export const haptics = {
  /**
   * Feedback leggero per tap su bottoni, tab switch, ecc.
   */
  light: () => {
    if (Platform.OS === 'ios') {
      ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Light);
    } else {
      Vibration.vibrate(10);
    }
  },

  /**
   * Feedback medio per selezioni, toggle, ecc.
   */
  medium: () => {
    if (Platform.OS === 'ios') {
      ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Medium);
    } else {
      Vibration.vibrate(20);
    }
  },

  /**
   * Feedback forte per azioni importanti
   */
  heavy: () => {
    if (Platform.OS === 'ios') {
      ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Heavy);
    } else {
      Vibration.vibrate(30);
    }
  },

  /**
   * Feedback di successo (es. completamento azione)
   */
  success: () => {
    if (Platform.OS === 'ios') {
      ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Success);
    } else {
      Vibration.vibrate(15);
    }
  },

  /**
   * Feedback di errore
   */
  error: () => {
    if (Platform.OS === 'ios') {
      ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Error);
    } else {
      Vibration.vibrate([0, 30, 50, 30]);
    }
  },

  /**
   * Feedback di selezione (molto leggero)
   */
  selection: () => {
    if (Platform.OS === 'ios') {
      ExpoHaptics.selectionAsync();
    } else {
      Vibration.vibrate(5);
    }
  },
};
