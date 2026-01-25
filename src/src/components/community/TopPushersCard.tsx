import React from 'react';
import { StyleSheet, Text, View, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ModernCard } from '../ModernCard';
import { LeaderboardEntry } from '../../types/community';

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
    color: '#000',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
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
    backgroundColor: '#F8F8F8',
  },
  rowCurrentUser: {
    backgroundColor: '#E6F9F7',
    borderWidth: 2,
    borderColor: '#BDEEE7',
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
    backgroundColor: '#FFF4CC',
  },
  positionContainerSilver: {
    backgroundColor: '#E8E8E8',
  },
  positionContainerBronze: {
    backgroundColor: '#F0DCC8',
  },
  positionText: {
    fontSize: 13,
    fontFamily: 'Agdasima-Bold',
    color: '#666',
  },
  positionGoldText: {
    color: '#000',
  },
  positionSilverText: {
    color: '#000',
  },
  positionBronzeText: {
    color: '#000',
  },
  avatarContainer: {
    marginRight: 12,
    justifyContent: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DDD',
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#BDEEE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholderText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000',
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
    color: '#000',
    letterSpacing: 0.3,
  },
  nicknameHighlight: {
    color: '#00A896',
  },
  youBadge: {
    fontSize: 12,
    fontFamily: 'Agdasima-Bold',
    color: '#FFF',
    backgroundColor: '#000',
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
    color: '#000',
    letterSpacing: 0.3,
  },
  divider: {
    height: 1,
    backgroundColor: '#DDD',
    marginVertical: 16,
  },
});
