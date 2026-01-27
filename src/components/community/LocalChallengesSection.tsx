import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { ModernCard } from '../ModernCard';
import { haptics } from '../../utils/haptics';
import { LocalChallenge } from '../../types/community';
import { colors } from '../../theme';

interface LocalChallengesSectionProps {
  challenges: LocalChallenge[];
  onChallengePress?: (challenge: LocalChallenge) => void;
}

const ChallengeCard: React.FC<{
  challenge: LocalChallenge;
  onPress?: () => void;
}> = ({ challenge, onPress }) => {
  const { t } = useTranslation();

  // Calcola progresso percentuale
  const progressPercentage = Math.min(
    (challenge.currentPushups / challenge.targetPushups) * 100,
    100
  );

  // Calcola giorni rimanenti
  const now = new Date();
  const endDate = new Date(challenge.endDate);
  const daysRemaining = Math.max(
    0,
    Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  );

  // Formatta il tempo rimanente
  const getTimeRemainingText = (): string => {
    if (daysRemaining === 0) return t('community.lastDay');
    if (daysRemaining === 1) return t('community.oneDayRemaining');
    if (daysRemaining <= 7) return t('community.daysRemaining', { count: daysRemaining });
    return t('community.weeksRemaining', { count: Math.ceil(daysRemaining / 7) });
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => {
        haptics.light();
        onPress?.();
      }}
    >
      <ModernCard style={styles.challengeCard}>
        {/* Header sfida */}
        <View style={styles.challengeHeader}>
          <Text style={styles.challengeEmoji}>{challenge.emoji}</Text>
          <Text style={styles.challengeTitle} numberOfLines={2}>
            {challenge.title}
          </Text>
        </View>

        {/* Progresso collettivo */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressText}>
              <Text style={styles.progressValue}>
                {challenge.currentPushups.toLocaleString()}
              </Text>
              {' / '}
              {challenge.targetPushups.toLocaleString()} push-up
            </Text>
            <Text style={styles.percentageText}>{progressPercentage.toFixed(0)}%</Text>
          </View>

          {/* Barra progresso */}
          <View style={styles.progressBarBackground}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${progressPercentage}%` },
                progressPercentage >= 100 && styles.progressBarComplete,
              ]}
            />
          </View>
        </View>

        {/* Footer info */}
        <View style={styles.challengeFooter}>
          <View style={styles.footerItem}>
            <MaterialCommunityIcons name="account-group" size={14} color={colors.gray500} />
            <Text style={styles.footerText}>
              {t('community.participants', { count: challenge.participants.toLocaleString() })}
            </Text>
          </View>
          <View style={styles.footerItem}>
            <MaterialCommunityIcons name="clock-outline" size={14} color={colors.gray500} />
            <Text style={styles.footerText}>{getTimeRemainingText()}</Text>
          </View>
        </View>

        {/* Contributo utente */}
        {challenge.isParticipating && challenge.userContribution && challenge.userContribution > 0 && (
          <View style={styles.contributionBadge}>
            <Text style={styles.contributionText}>
              {t('community.yourContribution')} <Text style={styles.contributionValue}>{challenge.userContribution}</Text>
            </Text>
          </View>
        )}
      </ModernCard>
    </TouchableOpacity>
  );
};

export const LocalChallengesSection: React.FC<LocalChallengesSectionProps> = ({
  challenges,
  onChallengePress,
}) => {
  const { t } = useTranslation();

  if (challenges.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      {/* Header sezione */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{t('community.localChallenges')}</Text>
        <Text style={styles.sectionSubtitle}>
          {t('community.participateByTraining')}
        </Text>
      </View>

      {/* Lista sfide */}
      <View style={styles.challengesList}>
        {challenges.map((challenge) => (
          <ChallengeCard
            key={challenge.id}
            challenge={challenge}
            onPress={() => onChallengePress?.(challenge)}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 20,
    marginTop: 12,
  },
  sectionHeader: {
    // Spacing gestito dai singoli elementi
  },
  sectionTitle: {
    fontSize: 22,
    fontFamily: 'Agdasima-Bold',
    color: colors.black,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray500,
    letterSpacing: 0.2,
    paddingHorizontal: 4,
    marginTop: -12,
    marginBottom: 16,
  },
  challengesList: {
    // Cards gestiscono il loro marginBottom
  },
  challengeCard: {
    marginBottom: 12,
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  challengeEmoji: {
    fontSize: 24,
  },
  challengeTitle: {
    flex: 1,
    fontSize: 18,
    fontFamily: 'Agdasima-Bold',
    color: colors.black,
    letterSpacing: 0.3,
  },
  progressSection: {
    marginBottom: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray500,
    letterSpacing: 0.1,
  },
  progressValue: {
    fontSize: 16,
    fontFamily: 'Agdasima-Bold',
    color: colors.black,
  },
  percentageText: {
    fontSize: 20,
    fontFamily: 'Agdasima-Bold',
    color: colors.warning,
    letterSpacing: 0.2,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: colors.gray200,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  progressBarComplete: {
    backgroundColor: colors.primaryDark,
  },
  challengeFooter: {
    flexDirection: 'row',
    gap: 16,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.gray500,
    letterSpacing: 0.1,
  },
  contributionBadge: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.goldLight,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.gold,
  },
  contributionText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.gray500,
    textAlign: 'center',
    letterSpacing: 0.1,
  },
  contributionValue: {
    fontSize: 15,
    fontFamily: 'Agdasima-Bold',
    color: colors.black,
  },
});
