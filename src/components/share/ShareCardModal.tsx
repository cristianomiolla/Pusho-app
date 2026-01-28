import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Pressable,
  Text,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors } from '../../theme';
import { ShareCardPreview, CARD_WIDTH } from './ShareCardPreview';
import { ImageSourcePicker } from './ImageSourcePicker';
import { useShareCard } from '../../hooks/useShareCard';

interface ShareCardModalProps {
  visible: boolean;
  onClose: () => void;
  totalPushups: number;
  totalSets?: number;
  totalTime: number;
  qualityScore?: number;
}

export const ShareCardModal: React.FC<ShareCardModalProps> = ({
  visible,
  onClose,
  totalPushups,
  totalSets,
  totalTime,
  qualityScore,
}) => {
  const { t } = useTranslation();
  const [showImagePicker, setShowImagePicker] = useState(false);
  const {
    imageUri,
    isLoading,
    cardRef,
    captureCardRef,
    pickImageFromCamera,
    pickImageFromGallery,
    captureAndShare,
    resetImage,
  } = useShareCard();

  const handleClose = () => {
    resetImage();
    onClose();
  };

  const handleTakePhoto = async () => {
    setShowImagePicker(false);
    await pickImageFromCamera();
  };

  const handleChooseFromGallery = async () => {
    setShowImagePicker(false);
    await pickImageFromGallery();
  };

  const handleImagePress = () => {
    setShowImagePicker(true);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Preview Card with close button */}
          <Pressable onPress={handleImagePress} style={styles.previewContainer}>
            <ShareCardPreview
              ref={cardRef}
              imageUri={imageUri}
              totalPushups={totalPushups}
              totalSets={totalSets}
              totalTime={totalTime}
              qualityScore={qualityScore}
            />

            {/* Close button on card */}
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialCommunityIcons
                name="close"
                size={20}
                color={colors.white}
              />
            </TouchableOpacity>

            {/* Tap to add photo overlay */}
            {!imageUri && (
              <View style={styles.tapOverlay}>
                <MaterialCommunityIcons
                  name="camera-plus"
                  size={48}
                  color={colors.transparent.white50}
                />
                <Text style={styles.tapText}>{t('share.tapToAddPhoto')}</Text>
              </View>
            )}

            {/* Loading indicator */}
            {isLoading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            )}
          </Pressable>

          {/* Share button */}
          <TouchableOpacity
            style={[
              styles.shareButton,
              (!imageUri || isLoading) && styles.shareButtonDisabled,
            ]}
            onPress={captureAndShare}
            disabled={!imageUri || isLoading}
            activeOpacity={0.7}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.black} />
            ) : (
              <>
                <MaterialCommunityIcons
                  name="share-variant"
                  size={20}
                  color={colors.black}
                />
                <Text style={styles.shareButtonText}>{t('share.share')}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Image source picker */}
      <ImageSourcePicker
        visible={showImagePicker}
        onClose={() => setShowImagePicker(false)}
        onTakePhoto={handleTakePhoto}
        onChooseFromGallery={handleChooseFromGallery}
      />

      {/* Hidden card for capture (no borderRadius) */}
      <View style={styles.hiddenContainer}>
        <ShareCardPreview
          ref={captureCardRef}
          imageUri={imageUri}
          totalPushups={totalPushups}
          totalSets={totalSets}
          totalTime={totalTime}
          qualityScore={qualityScore}
          isCapturing={true}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.transparent.black80,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    alignItems: 'center',
  },
  previewContainer: {
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.transparent.black50,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  tapOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  tapText: {
    fontSize: 16,
    color: colors.transparent.white50,
    fontWeight: '500',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.transparent.black50,
    borderRadius: 16,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    marginTop: 16,
    width: CARD_WIDTH,
  },
  shareButtonDisabled: {
    opacity: 0.5,
  },
  shareButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.black,
  },
  hiddenContainer: {
    position: 'absolute',
    left: -9999,
    top: -9999,
  },
});

export default ShareCardModal;
