import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { ModernCard } from '../ModernCard';
import { UserRanking } from '../../types/community';

interface YourRankingCardProps {
  ranking: UserRanking;
}

export const YourRankingCard: React.FC<YourRankingCardProps> = ({ ranking }) => {
  const { t } = useTranslation();

  // Calcola il top % e determina la soglia da mostrare
  const topPercentage = (ranking.position / ranking.totalUsers) * 100;
  const getTopBadgeLabel = (): string | null => {
    if (topPercentage <= 1) return 'Top 1%';
    if (topPercentage <= 5) return 'Top 5%';
    if (topPercentage <= 10) return 'Top 10%';
    if (topPercentage <= 20) return 'Top 20%';
    if (topPercentage <= 30) return 'Top 30%';
    return null;
  };
  const topBadgeLabel = getTopBadgeLabel();

  // Determina il tipo di visualizzazione della barra
  const isFirst = ranking.position === 1;
  const isLast = ranking.nextPosition && !ranking.previousPosition;

  // Calcola la percentuale di progresso
  const getProgressPercentage = (): number => {
    if (isFirst && ranking.previousPosition) {
      // Primo: mostra quanto sei avanti rispetto al secondo (barra piena)
      return 100;
    }

    if (isLast && ranking.nextPosition) {
      // Ultimo: mostra quanto manca per raggiungere chi sta davanti
      // Usiamo una percentuale fissa bassa per mostrare che sei all'inizio
      return 15;
    }

    if (!ranking.nextPosition || !ranking.previousPosition) {
      return 50;
    }

    // Caso normale: posizione relativa tra chi sta dietro e chi sta davanti
    // gapBehind = vantaggio su chi sta dietro (quanto sei avanti rispetto a lui)
    // gapAhead = distanza da chi sta davanti (quanto ti manca per raggiungerlo)
    const gapBehind = ranking.previousPosition.pushupsDifference;
    const gapAhead = ranking.nextPosition.pushupsDifference;
    const totalGap = gapBehind + gapAhead;

    if (totalGap === 0) return 50;

    // Percentuale = posizione relativa nel range tra i due
    // Es: dietro ha 2, tu hai 9, davanti ha 12 → gapBehind=7, gapAhead=3, total=10
    // Risultato: 7/10 = 70% (sei più vicino a chi sta davanti)
    return (gapBehind / totalGap) * 100;
  };

  const progressPercentage = getProgressPercentage();

  // Label per le posizioni
  const getLeftLabel = (): string => {
    if (isFirst && ranking.previousPosition) {
      return `${ranking.previousPosition.position}`; // Mostra "2" a sinistra (chi insegue)
    }
    return ranking.previousPosition ? `${ranking.previousPosition.position}` : '';
  };

  const getRightLabel = (): string => {
    if (isFirst) {
      return `${ranking.position}`; // Mostra "1" a destra (tu sei primo)
    }
    return ranking.nextPosition ? `${ranking.nextPosition.position}` : '';
  };

  const leftLabel = getLeftLabel();
  const rightLabel = getRightLabel();

  // Determina se mostrare la barra di progresso
  const showProgressBar = ranking.nextPosition || ranking.previousPosition;

  return (
    <ModernCard style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t('community.yourRanking')}</Text>
        {topBadgeLabel && (
          <View style={styles.percentileBadge}>
            <Text style={styles.percentileText}>{topBadgeLabel}</Text>
          </View>
        )}
      </View>

      {/* Posizione principale */}
      <View style={styles.mainRanking}>
        <Text style={styles.rankingLabel}>{t('community.youAre')}</Text>
        <View style={styles.positionBadge}>
          <Text style={styles.positionText}>#{ranking.position}</Text>
        </View>
        <Text style={styles.rankingLabel}>
          {t('community.outOf')} <Text style={styles.totalUsers}>{ranking.totalUsers}</Text>
        </Text>
      </View>

      {/* Progress verso la prossima posizione */}
      {showProgressBar && (
        <View style={styles.progressSection}>
          {/* Barra con cerchi alle estremità */}
          <View style={styles.progressContainer}>
            {/* Cerchio posizione sinistra */}
            <View style={styles.positionCircle}>
              <Text style={styles.positionCircleText}>{leftLabel}</Text>
            </View>

            {/* Barra centrale */}
            <View style={styles.progressTrack}>
              {/* Fill con badge integrato */}
              <View style={[styles.progressFillContainer, isLast ? styles.progressFillMinimal : { width: `${Math.max(progressPercentage, 22)}%` }]}>
                <LinearGradient
                  colors={['#BDEEE7', '#5BBFB3']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.progressFill}
                />
                {/* Badge "Tu" all'estremità */}
                <View style={[styles.youBadge, isLast && styles.youBadgeLeft]}>
                  <Text style={styles.youBadgeText}>{t('community.you')}</Text>
                </View>
              </View>
            </View>

            {/* Cerchio posizione destra */}
            <View style={[styles.positionCircle, styles.positionCircleTarget]}>
              <Text style={[styles.positionCircleText, styles.positionCircleTextTarget]}>{rightLabel}</Text>
            </View>
          </View>

          {/* Distanza */}
          <Text style={styles.distanceText}>
            {isFirst && ranking.previousPosition
              ? t('community.pushupsAhead', { count: ranking.previousPosition.pushupsDifference, position: leftLabel })
              : ranking.nextPosition
                ? t('community.pushupsToPass', { count: ranking.nextPosition.pushupsDifference, position: rightLabel })
                : ''
            }
          </Text>
        </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Agdasima-Bold',
    color: '#000',
    letterSpacing: 0.3,
    flex: 1,
  },
  mainRanking: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    backgroundColor: '#F8F8F8',
    borderRadius: 16,
    marginBottom: 20,
  },
  rankingLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    letterSpacing: 0.2,
  },
  positionBadge: {
    backgroundColor: '#BDEEE7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  positionText: {
    fontSize: 36,
    fontFamily: 'Agdasima-Bold',
    color: '#000',
    letterSpacing: 0.3,
  },
  totalUsers: {
    fontSize: 18,
    fontFamily: 'Agdasima-Bold',
    color: '#000',
  },
  progressSection: {
    gap: 12,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  positionCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E8E8E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  positionCircleTarget: {
    backgroundColor: '#BDEEE7',
  },
  positionCircleText: {
    fontSize: 12,
    fontFamily: 'Agdasima-Bold',
    color: '#999',
  },
  positionCircleTextTarget: {
    color: '#2A9D8F',
  },
  progressTrack: {
    flex: 1,
    height: 28,
    backgroundColor: '#EBEBEB',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressFillContainer: {
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 48,
  },
  progressFillMinimal: {
    width: 'auto',
    minWidth: 0,
    paddingRight: 4,
  },
  progressFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    right: 0,
    borderRadius: 14,
  },
  youBadge: {
    marginLeft: 'auto',
    marginRight: 4,
    backgroundColor: '#000',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    zIndex: 1,
  },
  youBadgeLeft: {
    marginLeft: 4,
    marginRight: 'auto',
  },
  youBadgeText: {
    fontSize: 12,
    fontFamily: 'Agdasima-Bold',
    color: '#FFF',
    letterSpacing: 0.3,
  },
  distanceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
  percentileBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    flexShrink: 0,
  },
  percentileText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#000',
    letterSpacing: 0.3,
  },
});
