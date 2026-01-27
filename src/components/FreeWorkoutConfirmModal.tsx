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
import { colors } from '../theme';

interface FreeWorkoutConfirmModalProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const FreeWorkoutConfirmModal: React.FC<FreeWorkoutConfirmModalProps> = ({
  visible,
  onConfirm,
  onCancel,
}) => {
  const { t } = useTranslation();

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
            <MaterialCommunityIcons name="infinity" size={48} color={colors.primary} />
          </View>

          {/* Title */}
          <Text style={styles.title}>{t('workout.startFreeWorkout')}</Text>

          {/* Description */}
          <View style={styles.contentContainer}>
            <Text style={styles.description}>
              {t('workout.freeWorkoutInfo')}
            </Text>

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
    marginBottom: 16,
  },
  contentContainer: {
    gap: 16,
    width: '100%',
  },
  description: {
    fontSize: 15,
    color: colors.transparent.white80,
    textAlign: 'center',
    lineHeight: 22,
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
