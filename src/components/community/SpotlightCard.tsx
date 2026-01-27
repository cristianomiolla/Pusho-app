import React from 'react';
import { StyleSheet, Text, View, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { SpotlightUser, BadgeType } from '../../types/community';
import { colors, gradients } from '../../theme';

interface SpotlightCardProps {
  spotlight: SpotlightUser;
}

// Mapping badge -> emoji
const BADGE_EMOJI: Record<BadgeType, string> = {
  fire: '🔥',
  brick: '🧱',
  trophy: '🏆',
  star: '⭐',
  lightning: '⚡',
  target: '🎯',
};

export const SpotlightCard: React.FC<SpotlightCardProps> = ({ spotlight }) => {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      {/* Header sezione */}
      <View style={styles.header}>
        <Text style={styles.title}>{t('community.localSpotlight')}</Text>
        <Text style={styles.subtitle}>{t('community.pusherOfTheWeek')}</Text>
      </View>

      {/* Card principale con gradiente */}
      <LinearGradient
        colors={gradients.primaryLight}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientCard}
      >
        {/* Avatar e info utente */}
        <View style={styles.userSection}>
          <View style={styles.avatarContainer}>
            {spotlight.user.avatar ? (
              <Image
                source={{ uri: spotlight.user.avatar }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarPlaceholderText}>
                  {spotlight.user.nickname.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.userInfo}>
            <Text style={styles.nickname} numberOfLines={1}>
              {spotlight.user.nickname}
            </Text>
            <View style={styles.locationRow}>
              <MaterialCommunityIcons name="map-marker" size={14} color={colors.primaryDark} />
              <Text style={styles.location} numberOfLines={1}>
                {spotlight.user.location.city}
              </Text>
            </View>
          </View>
        </View>

        {/* Stats evidenziate */}
        <View style={styles.statsSection}>
          {spotlight.highlightStats.map((stat, index) => (
            <View key={index} style={styles.statItem}>
              <MaterialCommunityIcons name="check-circle" size={16} color={colors.primaryDark} />
              <Text style={styles.statLabel}>{stat.label}</Text>
              {stat.value && (
                <Text style={styles.statValue}> • {stat.value}</Text>
              )}
            </View>
          ))}
        </View>

        {/* Achievement speciale (opzionale) */}
        {spotlight.achievement && (
          <View style={styles.achievementBadge}>
            <Text style={styles.achievementText}>{spotlight.achievement}</Text>
          </View>
        )}
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginTop: 12,
  },
  header: {
    // Spacing gestito dai singoli elementi
  },
  title: {
    fontSize: 22,
    fontFamily: 'Agdasima-Bold',
    color: colors.black,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray500,
    letterSpacing: 0.2,
    paddingHorizontal: 4,
    marginTop: -12,
    marginBottom: 16,
  },
  gradientCard: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 2,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 6,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.white,
    borderWidth: 3,
    borderColor: colors.white,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.white,
  },
  avatarPlaceholderText: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primary,
  },
  userInfo: {
    flex: 1,
  },
  nickname: {
    fontSize: 22,
    fontFamily: 'Agdasima-Bold',
    color: colors.black,
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  location: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primaryDark,
    letterSpacing: 0.1,
  },
  statsSection: {
    gap: 10,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.black,
    letterSpacing: 0.1,
    flex: 1,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primaryDark,
    letterSpacing: 0.1,
  },
  achievementBadge: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.gold,
    borderRadius: 16,
    alignItems: 'center',
  },
  achievementText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.black,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
});
