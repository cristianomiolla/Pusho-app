import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { WorkoutSession } from '../types/workout';

interface SessionDetailModalProps {
  visible: boolean;
  session: WorkoutSession | null;
  onClose: () => void;
}

const getQualityColor = (score: number): string => {
  if (score >= 70) return '#4CAF50'; // Verde
  if (score >= 40) return '#FFC107'; // Giallo
  return '#F44336'; // Rosso
};

export const SessionDetailModal: React.FC<SessionDetailModalProps> = ({
  visible,
  session,
  onClose,
}) => {
  const { t, i18n } = useTranslation();

  if (!session) return null;

  const isCardSession = !!session.workoutCardId;
  const sessionTitle = isCardSession && session.workoutCardName
    ? session.workoutCardName
    : t('history.freeWorkout');

  const minutes = Math.floor(session.duration / 60);
  const seconds = session.duration % 60;
  const timeString = `${minutes}:${String(seconds).padStart(2, '0')}`;
  const qualityColor = getQualityColor(session.averageQuality);

  const formatSessionDate = (date: Date): string => {
    const sessionDate = new Date(date);
    const locale = i18n.language === 'it' ? 'it-IT' : 'en-US';
    return sessionDate.toLocaleDateString(locale, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatSessionTime = (date: Date): string => {
    const sessionDate = new Date(date);
    return sessionDate.toLocaleTimeString(i18n.language === 'it' ? 'it-IT' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.content} onStartShouldSetResponder={() => true}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Icon */}
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons
                name={isCardSession ? "clipboard-text-outline" : "arm-flex-outline"}
                size={48}
                color="#555"
              />
            </View>

            {/* Title */}
            <Text style={styles.title}>{sessionTitle}</Text>

            {/* Date & Time */}
            <Text style={styles.dateText}>
              {formatSessionDate(session.date)} • {formatSessionTime(session.date)}
            </Text>

            {/* Summary */}
            <View style={styles.summaryContainer}>
              <View style={styles.statCard}>
                <MaterialCommunityIcons name="arm-flex-outline" size={26} color="#666" />
                <Text style={styles.statValue}>{session.totalPushups}</Text>
                <Text style={styles.statLabel}>{t('workout.totalPushups')}</Text>
              </View>

              {isCardSession && (
                <View style={styles.statCard}>
                  <MaterialCommunityIcons name="repeat" size={26} color="#666" />
                  <Text style={styles.statValue}>
                    {session.completedSets || session.sets.length}
                    {session.targetSets && `/${session.targetSets}`}
                  </Text>
                  <Text style={styles.statLabel}>{t('workout.setsCompleted')}</Text>
                </View>
              )}

              <View style={styles.statCard}>
                <MaterialCommunityIcons name="timer-outline" size={26} color="#666" />
                <Text style={styles.statValue}>{timeString}</Text>
                <Text style={styles.statLabel}>{t('workout.totalTime')}</Text>
              </View>
            </View>

            {/* Quality Score Card */}
            <View style={[styles.qualityCard, { borderColor: qualityColor }]}>
              <View style={styles.qualityHeader}>
                <MaterialCommunityIcons name="chart-line" size={22} color={qualityColor} />
                <Text style={[styles.qualityTitle, { color: qualityColor }]}>
                  {t('workout.executionQuality')}
                </Text>
              </View>
              <Text style={[styles.qualityScore, { color: qualityColor }]}>
                {session.averageQuality}%
              </Text>
            </View>

            {/* Close Button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.closeButtonText}>{t('common.close')}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    width: '100%',
    maxWidth: 340,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: '#BDEEE7',
    shadowColor: '#BDEEE7',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 10,
  },
  scrollContent: {
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#BDEEE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Agdasima-Bold',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 8,
  },
  dateText: {
    fontSize: 14,
    color: '#444',
    textAlign: 'center',
    textTransform: 'capitalize',
    marginBottom: 20,
  },
  summaryContainer: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F2F2F2',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 22,
    fontFamily: 'Agdasima-Bold',
    color: '#000',
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
  qualityCard: {
    width: '100%',
    backgroundColor: '#F5F5F7',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  qualityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  qualityTitle: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  qualityScore: {
    fontSize: 44,
    fontFamily: 'Agdasima-Bold',
  },
  closeButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '600',
  },
});
