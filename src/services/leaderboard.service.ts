import { supabase } from '../config/supabase';
import type { Profile } from '../types/database';
import type {
  LeaderboardEntry,
  UserRanking,
  CommunityPeriod,
  CommunityUser,
  BadgeType,
} from '../types/community';

// Helper: calcola data inizio periodo
const getStartDate = (period: CommunityPeriod): Date => {
  const now = new Date();
  switch (period) {
    case 'today':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    case 'week':
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 7);
      return weekAgo;
    case 'month':
      const monthAgo = new Date(now);
      monthAgo.setMonth(now.getMonth() - 1);
      return monthAgo;
    default:
      return now;
  }
};

// Helper: converte profile DB a CommunityUser
const toCommunityUser = (
  profile: Profile,
  pushups: number
): CommunityUser => ({
  id: profile.id,
  nickname: profile.nickname,
  avatar: profile.avatar_url ?? undefined,
  totalPushups: pushups,
  mainBadge: (profile.main_badge as BadgeType) || 'star',
  location: {
    city: profile.city || 'Unknown',
    region: profile.region ?? undefined,
    country: profile.country ?? undefined,
  },
  joinDate: new Date(profile.created_at),
});

/**
 * Fetch profiles by user IDs
 */
const fetchProfilesByIds = async (userIds: string[]): Promise<Map<string, Profile>> => {
  if (userIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .in('id', userIds);

  if (error) throw error;

  const profileMap = new Map<string, Profile>();
  for (const profile of data || []) {
    profileMap.set(profile.id, profile);
  }
  return profileMap;
};

/**
 * Fetch top pushers globali per periodo
 * Tutti i periodi (today/week/month) aggregano workout_sessions nel periodo
 */
export const fetchTopPushers = async (
  period: CommunityPeriod = 'week',
  currentUserId?: string,
  limit: number = 5
): Promise<LeaderboardEntry[]> => {
  try {
    // Tutti i periodi: aggreghiamo workout_sessions nel range di date
    const startDate = getStartDate(period);

    const { data, error } = await supabase
      .from('workout_sessions')
      .select('user_id, total_pushups')
      .gte('date', startDate.toISOString());

    if (error) throw error;
    if (!data || data.length === 0) return [];

    // Aggreghiamo i pushups per utente
    const userPushups = new Map<string, number>();
    for (const session of data) {
      const current = userPushups.get(session.user_id) || 0;
      userPushups.set(session.user_id, current + session.total_pushups);
    }

    // Ordiniamo e prendiamo top N
    const sorted = Array.from(userPushups.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);

    // Fetch profiles separatamente
    const userIds = sorted.map(([userId]) => userId);
    const profiles = await fetchProfilesByIds(userIds);

    return sorted.map(([userId, pushups], index) => {
      const profile = profiles.get(userId);
      if (!profile) return null;

      return {
        position: index + 1,
        user: toCommunityUser(profile, pushups),
        pushups,
        isCurrentUser: profile.id === currentUserId,
      };
    }).filter((entry): entry is LeaderboardEntry => entry !== null);
  } catch (error) {
    console.error('Error fetching top pushers:', error);
    return [];
  }
};

/**
 * Fetch ranking personale dell'utente corrente
 * Tutti i periodi usano workout_sessions filtrate per data
 */
export const fetchUserRanking = async (
  userId: string,
  period: CommunityPeriod = 'week'
): Promise<UserRanking | null> => {
  try {
    let userPushups = 0;
    let allUsersPushups: { odUserId: string; pushups: number }[] = [];

    // Tutti i periodi: aggreghiamo workout_sessions nel range di date
    const startDate = getStartDate(period);

    const { data: sessions, error } = await supabase
      .from('workout_sessions')
      .select('user_id, total_pushups')
      .gte('date', startDate.toISOString());

    if (error) throw error;

    // Aggreghiamo per utente
    const userMap = new Map<string, number>();
    for (const session of sessions || []) {
      const current = userMap.get(session.user_id) || 0;
      userMap.set(session.user_id, current + session.total_pushups);
    }

    userPushups = userMap.get(userId) || 0;
    allUsersPushups = Array.from(userMap.entries())
      .map(([id, pushups]) => ({ odUserId: id, pushups }))
      .sort((a, b) => b.pushups - a.pushups);

    // Se non ci sono utenti, l'utente è primo di 1
    if (allUsersPushups.length === 0) {
      return {
        position: 1,
        totalUsers: 1,
        pushups: userPushups,
        percentile: 100,
      };
    }

    // Trova posizione utente
    const userIndex = allUsersPushups.findIndex(u => u.odUserId === userId);
    const position = userIndex >= 0 ? userIndex + 1 : allUsersPushups.length + 1;
    const totalUsers = userIndex >= 0 ? allUsersPushups.length : allUsersPushups.length + 1;

    // Calcola percentile (% di utenti che l'utente supera)
    const percentile = totalUsers > 1
      ? ((totalUsers - position) / (totalUsers - 1)) * 100
      : 100;

    // Trova utente sopra e sotto
    let nextPosition: UserRanking['nextPosition'];
    let previousPosition: UserRanking['previousPosition'];

    if (userIndex > 0) {
      const above = allUsersPushups[userIndex - 1];
      nextPosition = {
        position: userIndex,
        pushupsDifference: above.pushups - userPushups + 1,
      };
    }

    if (userIndex >= 0 && userIndex < allUsersPushups.length - 1) {
      const below = allUsersPushups[userIndex + 1];
      previousPosition = {
        position: userIndex + 2,
        pushupsDifference: userPushups - below.pushups,
      };
    }

    return {
      position,
      totalUsers,
      pushups: userPushups,
      nextPosition,
      previousPosition,
      percentile: Math.round(percentile * 10) / 10,
    };
  } catch (error) {
    console.error('Error fetching user ranking:', error);
    return null;
  }
};

/**
 * Fetch totale utenti nella community
 */
export const fetchTotalUsers = async (): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Error fetching total users:', error);
    return 0;
  }
};
