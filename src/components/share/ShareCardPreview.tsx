import React, { forwardRef } from 'react';
import { View, Image, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ShareStatsOverlay } from './ShareStatsOverlay';

// Ratio 9:16 per TikTok/Reels
export const CARD_RATIO = 9 / 16;
const SCREEN_HEIGHT = Dimensions.get('window').height;
// Limita l'altezza al 55% dello schermo per non essere troppo grande
export const CARD_HEIGHT = Math.min(SCREEN_HEIGHT * 0.55, 500);
export const CARD_WIDTH = CARD_HEIGHT * CARD_RATIO;

// Dimensioni ad alta risoluzione per l'export (1080x1920)
export const CAPTURE_WIDTH = 1080;
export const CAPTURE_HEIGHT = 1920;

interface ShareCardPreviewProps {
  imageUri: string | null;
  totalPushups: number;
  totalSets?: number;
  totalTime: number;
  qualityScore?: number;
  isCapturing?: boolean;
}

export const ShareCardPreview = forwardRef<View, ShareCardPreviewProps>(
  ({ imageUri, totalPushups, totalSets, totalTime, qualityScore, isCapturing = false }, ref) => {
    const containerStyle = isCapturing
      ? [styles.containerCapturing]
      : [styles.container];

    return (
      <View ref={ref} style={containerStyle} collapsable={false}>
        {/* Background image or placeholder */}
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.placeholder} />
        )}

        {/* Gradient overlay */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.85)']}
          locations={[0, 0.4, 1]}
          style={styles.gradient}
        />

        {/* Stats overlay */}
        <ShareStatsOverlay
          totalPushups={totalPushups}
          totalSets={totalSets}
          totalTime={totalTime}
          qualityScore={qualityScore}
          isCapturing={isCapturing}
        />
      </View>
    );
  }
);

ShareCardPreview.displayName = 'ShareCardPreview';

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
  },
  containerCapturing: {
    width: CAPTURE_WIDTH,
    height: CAPTURE_HEIGHT,
    borderRadius: 0,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  placeholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#2a2a2a',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
});

export default ShareCardPreview;
