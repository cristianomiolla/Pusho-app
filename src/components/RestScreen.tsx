import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

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
          <Ionicons name="time-outline" size={48} color="#BDEEE7" />
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
          <Ionicons name="play-skip-forward" size={20} color="#000" />
          <Text style={styles.skipButtonText}>{t('workout.skipRest')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    backgroundColor: '#1C1C1E',
    borderRadius: 24,
    width: '100%',
    maxWidth: 340,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BDEEE7',
    shadowColor: '#BDEEE7',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 30,
    elevation: 10,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(189, 238, 231, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Agdasima-Bold',
    color: '#BDEEE7',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  timerContainer: {
    width: '100%',
    backgroundColor: 'rgba(189, 238, 231, 0.08)',
    paddingVertical: 32,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  timerText: {
    fontSize: 64,
    fontFamily: 'Agdasima-Bold',
    color: '#BDEEE7',
    letterSpacing: 4,
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#BDEEE7',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 16,
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
});
