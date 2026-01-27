import React, { useState, useRef, useEffect, useCallback } from 'react';
import { StyleSheet, View, StatusBar, ScrollView, Animated, ActivityIndicator, Text, RefreshControl } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { HeaderLocation, TopPushersCard, YourRankingCard, LocalChallengesSection, SpotlightCard, LockedFeatureSection } from '../components/community';
import { Location, CommunityPeriod, LocalChallenge, SpotlightUser, UserRanking } from '../types/community';
import { useCommunityData } from '../hooks/useCommunityData';
import { useWorkout } from '../contexts/WorkoutContext';
import { useAuth } from '../contexts/AuthContext';
import { LeaderboardEntry } from '../types/community';
import { colors } from '../theme';

export const CommunityScreen = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();

  // Calcolo dinamico padding bottom per tab bar
  const tabBarTotalHeight = 80 + (insets.bottom > 0 ? insets.bottom : 10) + 10;
  const scrollPaddingBottom = tabBarTotalHeight + 20;

  // Aggiorna la StatusBar quando la schermata diventa attiva
  useFocusEffect(
    React.useCallback(() => {
      StatusBar.setBarStyle('dark-content');
    }, [])
  );

  // Location globale (filtri geografici verranno implementati quando ci saranno più utenti)
  const [location] = useState<Location>({
    city: 'Globale',
    region: '',
    country: '',
  });

  // Stati per filtri
  const [period, setPeriod] = useState<CommunityPeriod>('week');

  // Fetch dati reali dal database
  const { leaderboard, userRanking, totalUsers, isLoading, error, refresh } = useCommunityData(period);
  const [refreshing, setRefreshing] = useState(false);
  const { shouldRefreshCommunity, clearCommunityRefresh } = useWorkout();

  // Refresh automatico dopo un allenamento
  useEffect(() => {
    if (shouldRefreshCommunity) {
      refresh();
      clearCommunityRefresh();
    }
  }, [shouldRefreshCommunity, refresh, clearCommunityRefresh]);

  // Animazione fade per il cambio periodo
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Fade out e fade in quando cambia il periodo
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [period, fadeAnim]);

  // Mock data per challenges (da implementare con DB in futuro)
  const [challenges] = useState<LocalChallenge[]>([
    {
      id: '1',
      title: 'Global - 10.000 push-up in 7 giorni',
      emoji: '🔥',
      location: { city: 'Globale' },
      targetPushups: 10000,
      currentPushups: 7350,
      startDate: new Date(2026, 0, 10),
      endDate: new Date(2026, 0, 17),
      participants: 156,
      isParticipating: true,
      userContribution: 820,
    },
  ]);

  const handleChangeArea = () => {
    // TODO: Aprire modal per cambiare area (coming soon)
    console.log('Cambia area');
  };

  // Mock data per spotlight (da implementare con DB in futuro)
  const [spotlight] = useState<SpotlightUser>({
    user: {
      id: '10',
      nickname: 'MarcoFit',
      totalPushups: 1850,
      mainBadge: 'brick',
      location: { city: 'Italia' },
      joinDate: new Date(2025, 11, 1),
    },
    reason: 'Miglior miglioramento',
    highlightStats: [
      { label: 'Si allena 5 volte a settimana' },
      { label: 'Qualità media', value: '92%' },
      { label: '+450 push-up rispetto alla settimana scorsa' },
    ],
    period: 'week',
  });

  const handleChallengePress = (challenge: LocalChallenge) => {
    // TODO: Aprire dettagli sfida
    console.log('Challenge pressed:', challenge.title);
  };

  const handleChangePeriod = (newPeriod: CommunityPeriod) => {
    setPeriod(newPeriod);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  // Default ranking per quando non ci sono dati
  const defaultRanking: UserRanking = {
    position: 1,
    totalUsers: totalUsers || 1,
    pushups: 0,
    percentile: 100,
  };

  // Mostra loading solo al primo caricamento
  const showLoading = isLoading && leaderboard.length === 0;

  // Costruisci currentUserEntry se l'utente non è nella top 5
  const isUserInLeaderboard = leaderboard.some(entry => entry.isCurrentUser);
  const currentUserEntry: LeaderboardEntry | undefined =
    !isUserInLeaderboard && userRanking && profile
      ? {
          position: userRanking.position,
          user: {
            id: profile.id,
            nickname: profile.nickname,
            avatar: profile.avatar_url ?? undefined,
            totalPushups: userRanking.pushups,
            mainBadge: (profile.main_badge as LeaderboardEntry['user']['mainBadge']) || 'star',
            location: {
              city: profile.city || 'Unknown',
              region: profile.region ?? undefined,
              country: profile.country ?? undefined,
            },
            joinDate: new Date(profile.created_at),
          },
          pushups: userRanking.pushups,
          isCurrentUser: true,
        }
      : undefined;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={{ paddingBottom: scrollPaddingBottom }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        >
          {/* Header: posizione + periodo */}
          <HeaderLocation
            location={location}
            period={period}
            onChangeArea={handleChangeArea}
            onChangePeriod={handleChangePeriod}
          />

          {/* Loading State */}
          {showLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>{t('common.loading')}</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : (
            /* Cards animate con fade quando cambia il periodo */
            <Animated.View style={{ opacity: fadeAnim }}>
              {/* Your Ranking - prima */}
              <YourRankingCard ranking={userRanking || defaultRanking} />

              {/* Top Pushers - dopo */}
              <TopPushersCard entries={leaderboard} currentUserEntry={currentUserEntry} />
            </Animated.View>
          )}

          {/* Local Challenges - Locked */}
          <LockedFeatureSection>
            <LocalChallengesSection
              challenges={challenges}
              onChallengePress={handleChallengePress}
            />
          </LockedFeatureSection>

          {/* Spotlight - Locked */}
          <LockedFeatureSection>
            <SpotlightCard spotlight={spotlight} />
          </LockedFeatureSection>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: colors.gray500,
    fontWeight: '600',
  },
  errorContainer: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
    fontWeight: '600',
    textAlign: 'center',
  },
});
