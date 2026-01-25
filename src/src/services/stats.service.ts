import { supabase } from '../config/supabase';
import type { UserStats } from '../types/database';
import type { WorkoutStats } from '../types/workout';

// Converte da DB a tipo app
const toWorkoutStats = (dbStats: UserStats): WorkoutStats => ({
  totalPushups: dbStats.total_pushups,
  maxInSingleSet: dbStats.max_in_single_set,
  totalTimeUnderTension: dbStats.total_time_under_tension,
  totalSessions: dbStats.total_sessions,
  averageQuality: Number(dbStats.average_quality) || 0,
});

// Fetch statistiche utente
export const fetchUserStats = async (userId: string): Promise<WorkoutStats> => {
  const { data, error } = await supabase
    .from('user_stats')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    // Se non esistono stats, ritorna valori di default
    if (error.code === 'PGRST116') {
      return {
        totalPushups: 0,
        maxInSingleSet: 0,
        totalTimeUnderTension: 0,
        totalSessions: 0,
        averageQuality: 0,
      };
    }
    console.error('Error fetching user stats:', error);
    throw error;
  }

  return toWorkoutStats(data);
};

// Crea stats iniziali per nuovo utente (chiamato se il trigger non ha funzionato)
export const initializeUserStats = async (userId: string): Promise<void> => {
  const { error } = await supabase
    .from('user_stats')
    .upsert({ user_id: userId }, { onConflict: 'user_id' });

  if (error) {
    console.error('Error initializing user stats:', error);
    throw error;
  }
};
