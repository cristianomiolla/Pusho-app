import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { WorkoutCard } from '../types/workout';

interface WorkoutConfirmModalProps {
  visible: boolean;
  workoutCard: WorkoutCard | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export const WorkoutConfirmModal: React.FC<WorkoutConfirmModalProps> = ({
  visible,
  workoutCard,
  onConfirm,
  onCancel,
}) => {
  const { t } = useTranslation();

  if (!workoutCard) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Ionicons name="fitness" size={48} color="#BDEEE7" />
          </View>

          {/* Title */}
          <Text style={styles.title}>{t('workout.startWorkout')}</Text>

          {/* Riepilogo scheda */}
          <View style={styles.cardSummary}>
            <Text style={styles.cardName}>{workoutCard.name}</Text>

            <View style={styles.detailsContainer}>
              <View style={styles.detailRow}>
                <Ionicons name="barbell-outline" size={20} color="#BDEEE7" />
                <Text style={styles.detailLabel}>{t('workout.pushupPerSet')}</Text>
                <Text style={styles.detailValue}>{workoutCard.repsPerSet}</Text>
              </View>

              <View style={styles.detailRow}>
                <Ionicons name="repeat-outline" size={20} color="#BDEEE7" />
                <Text style={styles.detailLabel}>{t('workout.numberOfSets')}</Text>
                <Text style={styles.detailValue}>{workoutCard.sets}</Text>
              </View>

              <View style={styles.detailRow}>
                <Ionicons name="timer-outline" size={20} color="#BDEEE7" />
                <Text style={styles.detailLabel}>{t('workout.restTime')}</Text>
                <Text style={styles.detailValue}>{workoutCard.restTime}s</Text>
              </View>
            </View>

            {workoutCard.variant && (
              <View style={styles.variantContainer}>
                <Text style={styles.variantLabel}>{t('workout.variant')}</Text>
                <Text style={styles.variantText}>{workoutCard.variant}</Text>
              </View>
            )}

            {/* Info importante */}
            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={18} color="#FFB800" />
              <Text style={styles.infoText}>
                {t('workout.navigationDisabled')}
              </Text>
            </View>
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.confirmButton]}
              onPress={onConfirm}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark-circle" size={20} color="#000" />
              <Text style={styles.confirmButtonText}>{t('workout.start')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
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
  modalContainer: {
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
  cardSummary: {
    gap: 16,
    width: '100%',
  },
  cardName: {
    fontSize: 18,
    fontFamily: 'Agdasima-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  detailsContainer: {
    backgroundColor: 'rgba(189, 238, 231, 0.05)',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailLabel: {
    flex: 1,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 16,
    color: '#BDEEE7',
    fontFamily: 'Agdasima-Bold',
  },
  variantContainer: {
    backgroundColor: 'rgba(189, 238, 231, 0.08)',
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#BDEEE7',
  },
  variantLabel: {
    fontSize: 12,
    color: '#BDEEE7',
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  variantText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 18,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 184, 0, 0.1)',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 0, 0.3)',
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
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
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  cancelButtonText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#BDEEE7',
  },
  confirmButtonText: {
    fontSize: 16,
    color: '#000',
    fontWeight: '600',
  },
});