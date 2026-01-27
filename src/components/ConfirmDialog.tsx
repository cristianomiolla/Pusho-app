import React from 'react';
import { StyleSheet, Text, View, Modal, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  iconColor?: string;
  confirmButtonColor?: string;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  visible,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  icon = 'alert-circle-outline',
  iconColor = '#FF3B30',
  confirmButtonColor = '#FF3B30',
}) => {
  const { t } = useTranslation();

  const resolvedConfirmText = confirmText ?? t('common.confirm');
  const resolvedCancelText = cancelText ?? t('common.cancel');
  // Determina il colore di sfondo in base al tipo di icona
  const getIconBackgroundColor = () => {
    if (icon === 'check-circle-outline' || icon === 'check-circle') {
      return '#34C75915'; // Verde con trasparenza
    }
    return `${iconColor}15`; // Default: colore icona con trasparenza
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent={true}
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          {/* Icon */}
          <View style={[styles.iconContainer, { backgroundColor: getIconBackgroundColor() }]}>
            <MaterialCommunityIcons name={icon} size={48} color={iconColor} />
          </View>

          {/* Title */}
          <Text style={styles.title}>{title}</Text>

          {/* Message */}
          <Text style={styles.message}>{message}</Text>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelText}>{resolvedCancelText}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.confirmButton, { backgroundColor: confirmButtonColor }]}
              onPress={onConfirm}
              activeOpacity={0.7}
            >
              <Text style={styles.confirmText}>{resolvedConfirmText}</Text>
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
  dialog: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 340,
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
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Agdasima-Bold',
    color: '#000',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#F5F5F7',
  },
  confirmButton: {
    backgroundColor: '#FF3B30',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  confirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});
