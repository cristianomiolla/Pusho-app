import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors } from '../theme';

interface RestScreenProps {
  timeRemaining: number; // in secondi
  currentSet: number;
  totalSets: number;
  onSkip: () => void;
}

export const RestScreen: React.FC<RestScreenProps> = ({
  timeRemaining,
  currentSet,
  totalSets,
  onSkip,
}) => {
  const { t } = useTranslation();
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const timeString = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons name="clock-outline" size={48} color={colors.primary} />
        </View>

        {/* Title */}
        <Text style={styles.title}>{t('workout.rest')}</Text>

        {/* Message */}
        <Text style={styles.message}>
          {t('workout.setCompleted', { currentSet, totalSets })}
        </Text>

        {/* Countdown */}
        <View style={styles.timerContainer}>
          <Text style={styles.timerText}>{timeString}</Text>
        </View>

        {/* Button */}
        <TouchableOpacity
          style={styles.skipButton}
          onPress={onSkip}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="skip-next" size={20} color={colors.black} />
          <Text style={styles.skipButtonText}>{t('workout.skipRest')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.transparent.black50,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    backgroundColor: colors.gray900,
    borderRadius: 24,
    width: '100%',
    maxWidth: 340,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 30,
    elevation: 10,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.transparent.primary15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Agdasima-Bold',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: colors.transparent.white70,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  timerContainer: {
    width: '100%',
    backgroundColor: colors.transparent.primary08,
    paddingVertical: 32,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  timerText: {
    fontSize: 64,
    fontFamily: 'Agdasima-Bold',
    color: colors.primary,
    letterSpacing: 4,
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    width: '100%',
    paddingVertical: 14,
    borderRadius: 16,
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.black,
  },
});
