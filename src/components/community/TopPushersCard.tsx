import React from 'react';
import { StyleSheet, Text, View, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ModernCard } from '../ModernCard';
import { LeaderboardEntry } from '../../types/community';
import { colors } from '../../theme';

interface TopPushersCardProps {
  entries: LeaderboardEntry[];
  currentUserEntry?: LeaderboardEntry;
}


export const TopPushersCard: React.FC<TopPushersCardProps> = ({
  entries,
  currentUserEntry,
}) => {
  const { t } = useTranslation();

  const formatPushups = (pushups: number): string => {
    return pushups.toString();
  };

  const renderRow = (entry: LeaderboardEntry) => {
    const isPodium = entry.position <= 3;
    const isCurrentUser = entry.isCurrentUser;

    // Determina lo stile del podio in base alla posizione
    const getPodiumTextStyle = () => {
      if (entry.position === 1) return styles.positionGoldText;
      if (entry.position === 2) return styles.positionSilverText;
      if (entry.position === 3) return styles.positionBronzeText;
      return null;
    };

    const getPodiumContainerStyle = () => {
      if (entry.position === 1) return styles.positionContainerGold;
      if (entry.position === 2) return styles.positionContainerSilver;
      if (entry.position === 3) return styles.positionContainerBronze;
      return null;
    };

    return (
      <View
        key={entry.user.id}
        style={[
          styles.row,
          isCurrentUser && styles.rowCurrentUser,
        ]}
      >
        {/* Posizione */}
        <View style={[styles.positionContainer, isPodium && styles.positionContainerPodium, getPodiumContainerStyle()]}>
          <Text style={[styles.positionText, getPodiumTextStyle()]}>
            {entry.position}
          </Text>
        </View>

        {/* Avatar */}
        <View style={styles.avatarContainer}>
          {entry.user.avatar ? (
            <Image source={{ uri: entry.user.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarPlaceholderText}>
                {entry.user.nickname.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        {/* Info utente */}
        <View style={styles.userInfo}>
          <View style={styles.nicknameRow}>
            <Text
              style={[styles.nickname, isCurrentUser && styles.nicknameHighlight]}
              numberOfLines={1}
            >
              {entry.user.nickname}
            </Text>
            {isCurrentUser && <Text style={styles.youBadge}>{t('community.you')}</Text>}
          </View>
        </View>

        {/* Push-up */}
        <View style={styles.rightSection}>
          <Text style={styles.pushups}>
            {formatPushups(entry.pushups)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <ModernCard style={styles.card}>
      {/* Titolo */}
      <View style={styles.header}>
        <Text style={styles.title}>{t('community.topPushers')}</Text>
        <Text style={styles.subtitle}>{t('community.topPushersSubtitle')}</Text>
      </View>

      {/* Lista Top */}
      <View style={styles.list}>
        {entries.map((entry) => renderRow(entry))}
      </View>

      {/* Utente corrente se fuori classifica */}
      {currentUserEntry && !entries.find((e) => e.isCurrentUser) && (
        <>
          <View style={styles.divider} />
          {renderRow(currentUserEntry)}
        </>
      )}
    </ModernCard>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    marginBottom: 12,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Agdasima-Bold',
    color: colors.black,
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray500,
    letterSpacing: 0.2,
  },
  list: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: colors.gray100,
  },
  rowCurrentUser: {
    backgroundColor: colors.primaryLight,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  positionContainer: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  positionContainerPodium: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  positionContainerGold: {
    backgroundColor: colors.goldLight,
  },
  positionContainerSilver: {
    backgroundColor: colors.gray200,
  },
  positionContainerBronze: {
    backgroundColor: colors.bronzeLight,
  },
  positionText: {
    fontSize: 13,
    fontFamily: 'Agdasima-Bold',
    color: colors.gray500,
  },
  positionGoldText: {
    color: colors.black,
  },
  positionSilverText: {
    color: colors.black,
  },
  positionBronzeText: {
    color: colors.black,
  },
  avatarContainer: {
    marginRight: 12,
    justifyContent: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.gray200,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholderText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.black,
  },
  userInfo: {
    flex: 1,
    marginRight: 12,
    justifyContent: 'center',
  },
  nicknameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  nickname: {
    fontSize: 18,
    fontFamily: 'Agdasima-Bold',
    color: colors.black,
    letterSpacing: 0.3,
  },
  nicknameHighlight: {
    color: colors.primaryDark,
  },
  youBadge: {
    fontSize: 12,
    fontFamily: 'Agdasima-Bold',
    color: colors.white,
    backgroundColor: colors.black,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    overflow: 'hidden',
    letterSpacing: 0.3,
  },
  rightSection: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  pushups: {
    fontSize: 22,
    fontFamily: 'Agdasima-Bold',
    color: colors.black,
    letterSpacing: 0.3,
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray200,
    marginVertical: 16,
  },
});
