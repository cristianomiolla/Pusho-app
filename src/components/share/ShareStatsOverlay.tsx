import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../../theme';

interface ShareStatsOverlayProps {
  totalPushups: number;
  totalSets?: number;
  totalTime: number; // in secondi
  qualityScore?: number; // 0-100
  isCapturing?: boolean;
}

// Fattore di scala per l'export ad alta risoluzione
const CAPTURE_SCALE = 1920 / 500; // ~3.84x

export const ShareStatsOverlay: React.FC<ShareStatsOverlayProps> = ({
  totalPushups,
  totalSets,
  totalTime,
  qualityScore,
  isCapturing = false,
}) => {
  const { t } = useTranslation();
  const minutes = Math.floor(totalTime / 60);
  const seconds = totalTime % 60;
  const timeString = `${minutes}:${String(seconds).padStart(2, '0')}`;

  // Usa dimensioni scalate per la cattura ad alta risoluzione
  const scale = isCapturing ? CAPTURE_SCALE : 1;

  const dynamicStyles = {
    statsContainer: {
      paddingHorizontal: 24 * scale,
      paddingBottom: 72 * scale,
    },
    mainStatContainer: {
      marginBottom: 16 * scale,
    },
    mainStatValue: {
      fontSize: 56 * scale,
    },
    mainStatLabel: {
      fontSize: 14 * scale,
      letterSpacing: 2 * scale,
    },
    secondaryStatsRow: {
      gap: 32 * scale,
    },
    secondaryStatValue: {
      fontSize: 22 * scale,
    },
    secondaryStatLabel: {
      fontSize: 10 * scale,
      letterSpacing: 1 * scale,
      marginTop: 2 * scale,
    },
    logoContainer: {
      bottom: 12 * scale,
      right: 16 * scale,
    },
    logo: {
      width: 48 * scale,
      height: 48 * scale,
      borderRadius: 10 * scale,
    },
  };

  return (
    <View style={styles.container}>
      {/* Gradient overlay */}
      <View style={styles.gradient} />

      {/* Stats content */}
      <View style={[styles.statsContainer, dynamicStyles.statsContainer]}>
        {/* Main stat - Push-ups */}
        <View style={[styles.mainStatContainer, dynamicStyles.mainStatContainer]}>
          <Text style={[styles.mainStatValue, dynamicStyles.mainStatValue]}>{totalPushups}</Text>
          <Text style={[styles.mainStatLabel, dynamicStyles.mainStatLabel]}>{t('share.pushups')}</Text>
        </View>

        {/* Secondary stats row */}
        <View style={[styles.secondaryStatsRow, dynamicStyles.secondaryStatsRow]}>
          {totalSets !== undefined && (
            <View style={styles.secondaryStat}>
              <Text style={[styles.secondaryStatValue, dynamicStyles.secondaryStatValue]}>{totalSets}</Text>
              <Text style={[styles.secondaryStatLabel, dynamicStyles.secondaryStatLabel]}>SERIE</Text>
            </View>
          )}

          <View style={styles.secondaryStat}>
            <Text style={[styles.secondaryStatValue, dynamicStyles.secondaryStatValue]}>{timeString}</Text>
            <Text style={[styles.secondaryStatLabel, dynamicStyles.secondaryStatLabel]}>TEMPO</Text>
          </View>

          {qualityScore !== undefined && qualityScore > 0 && (
            <View style={styles.secondaryStat}>
              <Text style={[styles.secondaryStatValue, dynamicStyles.secondaryStatValue]}>{qualityScore}%</Text>
              <Text style={[styles.secondaryStatLabel, dynamicStyles.secondaryStatLabel]}>QUALITÀ</Text>
            </View>
          )}
        </View>
      </View>

      {/* Logo Pusho */}
      <View style={[styles.logoContainer, dynamicStyles.logoContainer]}>
        <Image
          source={require('../../../assets/logo-pittogramma.png')}
          style={[styles.logo, dynamicStyles.logo]}
          resizeMode="contain"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    // Simuliamo il gradient con un overlay che parte dal basso
    // In realtà usiamo un LinearGradient nel componente padre
  },
  statsContainer: {
    paddingHorizontal: 24,
    paddingBottom: 72,
  },
  mainStatContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  mainStatValue: {
    fontSize: 56,
    fontFamily: 'Agdasima-Bold',
    color: colors.white,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  mainStatLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  secondaryStatsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
  },
  secondaryStat: {
    alignItems: 'center',
  },
  secondaryStatValue: {
    fontSize: 22,
    fontFamily: 'Agdasima-Bold',
    color: colors.white,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  secondaryStatLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.transparent.white70,
    letterSpacing: 1,
    marginTop: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  logoContainer: {
    position: 'absolute',
    bottom: 12,
    right: 16,
  },
  logo: {
    width: 48,
    height: 48,
    opacity: 0.8,
    borderRadius: 10,
  },
});

export default ShareStatsOverlay;
