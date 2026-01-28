import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, getQualityColor } from '../theme';

interface WorkoutCompletedScreenProps {
  totalPushups: number;
  totalSets?: number; // opzionale per modalità libera
  totalTime: number; // in secondi
  onSave: () => void;
  onExit: () => void;
  onShare?: () => void; // callback per aprire share modal
  // Metriche qualità (opzionali)
  qualityScore?: number; // 0-100
  averageDepth?: number; // angolo medio in gradi
  averageDownTime?: number; // tempo medio DOWN in ms
}

export const WorkoutCompletedScreen: React.FC<WorkoutCompletedScreenProps> = ({
  totalPushups,
  totalSets,
  totalTime,
  onSave,
  onExit,
  onShare,
  qualityScore,
  averageDepth,
  averageDownTime,
}) => {
  const { t } = useTranslation();
  const showSets = totalSets !== undefined;
  const showQuality = qualityScore !== undefined && qualityScore > 0;
  const minutes = Math.floor(totalTime / 60);
  const seconds = totalTime % 60;
  const timeString = `${minutes}:${String(seconds).padStart(2, '0')}`;
  const qualityColor = showQuality ? getQualityColor(qualityScore) : colors.primary;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Share button - top right */}
        {onShare && (
          <TouchableOpacity
            style={styles.shareButton}
            onPress={onShare}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialCommunityIcons name="share-variant" size={22} color={colors.primary} />
          </TouchableOpacity>
        )}

        {/* Icon */}
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons name="trophy" size={48} color={colors.gold} />
        </View>

        {/* Title */}
        <Text style={styles.title}>{t('workout.completed')}</Text>

        {/* Message */}
        <Text style={styles.message}>
          {t('workout.greatJob')}
        </Text>

        {/* Summary */}
        <View style={styles.summaryContainer}>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="arm-flex-outline" size={32} color={colors.primary} />
            <Text style={styles.statValue}>{totalPushups}</Text>
            <Text style={styles.statLabel}>{t('workout.totalPushups')}</Text>
          </View>

          {showSets && (
            <View style={styles.statCard}>
              <MaterialCommunityIcons name="repeat" size={32} color={colors.primary} />
              <Text style={styles.statValue}>{totalSets}</Text>
              <Text style={styles.statLabel}>{t('workout.setsCompleted')}</Text>
            </View>
          )}

          <View style={styles.statCard}>
            <MaterialCommunityIcons name="timer-outline" size={32} color={colors.primary} />
            <Text style={styles.statValue}>{timeString}</Text>
            <Text style={styles.statLabel}>{t('workout.totalTime')}</Text>
          </View>
        </View>

        {/* Quality Score Card */}
        {showQuality && (
          <View style={[styles.qualityCard, { borderColor: qualityColor }]}>
            <View style={styles.qualityHeader}>
              <MaterialCommunityIcons name="chart-line" size={24} color={qualityColor} />
              <Text style={[styles.qualityTitle, { color: qualityColor }]}>
                {t('workout.executionQuality')}
              </Text>
            </View>
            <Text style={[styles.qualityScore, { color: qualityColor }]}>
              {qualityScore}%
            </Text>
            <Text style={styles.qualityHint}>
              {t('workout.avgDepth')} {averageDepth}° • {t('workout.downTime')} {Math.round((averageDownTime || 0) / 100) / 10}s
            </Text>
          </View>
        )}

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.exitButton]}
            onPress={onExit}
            activeOpacity={0.7}
          >
            <Text style={styles.exitButtonText}>{t('workout.exit')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.saveButton]}
            onPress={onSave}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="check-circle" size={20} color={colors.black} />
            <Text style={styles.saveButtonText}>{t('common.save')}</Text>
          </TouchableOpacity>
        </View>
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
    position: 'relative',
  },
  shareButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.transparent.primary15,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.transparent.gold15,
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
  summaryContainer: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.transparent.primary08,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 6,
  },
  statValue: {
    fontSize: 22,
    fontFamily: 'Agdasima-Bold',
    color: colors.primary,
  },
  statLabel: {
    fontSize: 11,
    color: colors.transparent.white60,
    textAlign: 'center',
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    gap: 6,
  },
  exitButton: {
    backgroundColor: colors.transparent.white08,
  },
  exitButtonText: {
    fontSize: 16,
    color: colors.transparent.white90,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
  saveButtonText: {
    fontSize: 16,
    color: colors.black,
    fontWeight: '600',
  },
  // Stili per Quality Card
  qualityCard: {
    width: '100%',
    backgroundColor: colors.transparent.white05,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    alignItems: 'center',
  },
  qualityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  qualityTitle: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  qualityScore: {
    fontSize: 48,
    fontFamily: 'Agdasima-Bold',
    marginBottom: 4,
  },
  qualityHint: {
    fontSize: 11,
    color: colors.transparent.white50,
    textAlign: 'center',
  },
});
