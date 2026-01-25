import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  fetchTopPushers,
  fetchUserRanking,
  fetchTotalUsers,
} from '../services/leaderboard.service';
import type {
  LeaderboardEntry,
  UserRanking,
  CommunityPeriod,
} from '../types/community';

interface UseCommunityDataReturn {
  leaderboard: LeaderboardEntry[];
  userRanking: UserRanking | null;
  totalUsers: number;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useCommunityData = (
  period: CommunityPeriod = 'week'
): UseCommunityDataReturn => {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRanking, setUserRanking] = useState<UserRanking | null>(null);
  const [totalUsers, setTotalUsers] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch in parallelo per performance
      const [topPushers, ranking, total] = await Promise.all([
        fetchTopPushers(period, user.id, 5),
        fetchUserRanking(user.id, period),
        fetchTotalUsers(),
      ]);

      setLeaderboard(topPushers);
      setUserRanking(ranking);
      setTotalUsers(total);
    } catch (err) {
      console.error('Error fetching community data:', err);
      setError('Errore nel caricamento dei dati');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    leaderboard,
    userRanking,
    totalUsers,
    isLoading,
    error,
    refresh: fetchData,
  };
};
