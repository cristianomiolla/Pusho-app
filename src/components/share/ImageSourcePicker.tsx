import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors } from '../../theme';

interface ImageSourcePickerProps {
  visible: boolean;
  onClose: () => void;
  onTakePhoto: () => void;
  onChooseFromGallery: () => void;
}

export const ImageSourcePicker: React.FC<ImageSourcePickerProps> = ({
  visible,
  onClose,
  onTakePhoto,
  onChooseFromGallery,
}) => {
  const { t } = useTranslation();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.container}>
          <View style={styles.content}>
            <TouchableOpacity
              style={styles.option}
              onPress={onTakePhoto}
              activeOpacity={0.7}
            >
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons
                  name="camera"
                  size={28}
                  color={colors.primary}
                />
              </View>
              <Text style={styles.optionText}>{t('share.takePhoto')}</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.option}
              onPress={onChooseFromGallery}
              activeOpacity={0.7}
            >
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons
                  name="image-multiple"
                  size={28}
                  color={colors.primary}
                />
              </View>
              <Text style={styles.optionText}>{t('share.chooseFromGallery')}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelText}>{t('common.cancel')}</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.transparent.black50,
    justifyContent: 'flex-end',
    padding: 16,
  },
  container: {
    gap: 12,
  },
  content: {
    backgroundColor: colors.gray800,
    borderRadius: 16,
    overflow: 'hidden',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 16,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.transparent.primary15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionText: {
    fontSize: 17,
    color: colors.white,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: colors.transparent.white08,
    marginHorizontal: 20,
  },
  cancelButton: {
    backgroundColor: colors.gray800,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 17,
    color: colors.error,
    fontWeight: '600',
  },
});

export default ImageSourcePicker;
