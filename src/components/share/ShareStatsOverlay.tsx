import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { colors } from '../../theme';

interface ShareStatsOverlayProps {
  totalPushups: number;
  totalSets?: number;
  totalTime: number; // in secondi
  qualityScore?: number; // 0-100
}

export const ShareStatsOverlay: React.FC<ShareStatsOverlayProps> = ({
  totalPushups,
  totalSets,
  totalTime,
  qualityScore,
}) => {
  const minutes = Math.floor(totalTime / 60);
  const seconds = totalTime % 60;
  const timeString = `${minutes}:${String(seconds).padStart(2, '0')}`;

  return (
    <View style={styles.container}>
      {/* Gradient overlay */}
      <View style={styles.gradient} />

      {/* Stats content */}
      <View style={styles.statsContainer}>
        {/* Main stat - Push-ups */}
        <View style={styles.mainStatContainer}>
          <Text style={styles.mainStatValue}>{totalPushups}</Text>
          <Text style={styles.mainStatLabel}>PUSH-UPS</Text>
        </View>

        {/* Secondary stats row */}
        <View style={styles.secondaryStatsRow}>
          {totalSets !== undefined && (
            <View style={styles.secondaryStat}>
              <Text style={styles.secondaryStatValue}>{totalSets}</Text>
              <Text style={styles.secondaryStatLabel}>SERIE</Text>
            </View>
          )}

          <View style={styles.secondaryStat}>
            <Text style={styles.secondaryStatValue}>{timeString}</Text>
            <Text style={styles.secondaryStatLabel}>TEMPO</Text>
          </View>

          {qualityScore !== undefined && qualityScore > 0 && (
            <View style={styles.secondaryStat}>
              <Text style={styles.secondaryStatValue}>{qualityScore}%</Text>
              <Text style={styles.secondaryStatLabel}>QUALITÀ</Text>
            </View>
          )}
        </View>
      </View>

      {/* Logo Pusho */}
      <View style={styles.logoContainer}>
        <Image
          source={require('../../../assets/logo-pittogramma.png')}
          style={styles.logo}
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
