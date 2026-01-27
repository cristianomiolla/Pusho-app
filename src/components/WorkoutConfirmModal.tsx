import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { WorkoutCard } from '../types/workout';
import { colors } from '../theme';

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
            <MaterialCommunityIcons name="arm-flex" size={48} color={colors.primary} />
          </View>

          {/* Title */}
          <Text style={styles.title}>{t('workout.startWorkout')}</Text>

          {/* Riepilogo scheda */}
          <View style={styles.cardSummary}>
            <Text style={styles.cardName}>{workoutCard.name}</Text>

            <View style={styles.detailsContainer}>
              <View style={styles.detailRow}>
                <MaterialCommunityIcons name="arm-flex-outline" size={20} color={colors.primary} />
                <Text style={styles.detailLabel}>{t('workout.pushupPerSet')}</Text>
                <Text style={styles.detailValue}>{workoutCard.repsPerSet}</Text>
              </View>

              <View style={styles.detailRow}>
                <MaterialCommunityIcons name="repeat" size={20} color={colors.primary} />
                <Text style={styles.detailLabel}>{t('workout.numberOfSets')}</Text>
                <Text style={styles.detailValue}>{workoutCard.sets}</Text>
              </View>

              <View style={styles.detailRow}>
                <MaterialCommunityIcons name="timer-outline" size={20} color={colors.primary} />
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
              <MaterialCommunityIcons name="information" size={18} color={colors.warning} />
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
              <MaterialCommunityIcons name="check-circle" size={20} color={colors.black} />
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
    backgroundColor: colors.transparent.black50,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
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
  cardSummary: {
    gap: 16,
    width: '100%',
  },
  cardName: {
    fontSize: 18,
    fontFamily: 'Agdasima-Bold',
    color: colors.white,
    textAlign: 'center',
    marginBottom: 8,
  },
  detailsContainer: {
    backgroundColor: colors.transparent.primary05,
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
    color: colors.transparent.white70,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 16,
    color: colors.primary,
    fontFamily: 'Agdasima-Bold',
  },
  variantContainer: {
    backgroundColor: colors.transparent.primary08,
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  variantLabel: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  variantText: {
    fontSize: 13,
    color: colors.transparent.white80,
    lineHeight: 18,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.transparent.warning10,
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.transparent.warning30,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: colors.transparent.white80,
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
    backgroundColor: colors.transparent.white08,
  },
  cancelButtonText: {
    fontSize: 16,
    color: colors.transparent.white90,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: colors.primary,
  },
  confirmButtonText: {
    fontSize: 16,
    color: colors.black,
    fontWeight: '600',
  },
});