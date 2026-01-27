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
            <MaterialCommunityIcons name="infinity" size={48} color="#BDEEE7" />
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
              <MaterialCommunityIcons name="information" size={18} color="#FFB800" />
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
              <MaterialCommunityIcons name="check-circle" size={20} color="#000" />
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
    marginBottom: 16,
  },
  contentContainer: {
    gap: 16,
    width: '100%',
  },
  description: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 22,
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
