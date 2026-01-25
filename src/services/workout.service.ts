import { supabase } from '../config/supabase';
import type { WorkoutSessionDB, InsertTables } from '../types/database';
import type { WorkoutSession, WorkoutSet } from '../types/workout';

// Converte da DB a tipo app
const toWorkoutSession = (dbSession: WorkoutSessionDB): WorkoutSession => ({
  id: dbSession.id,
  date: new Date(dbSession.date),
  duration: dbSession.duration,
  totalPushups: dbSession.total_pushups,
  averageQuality: dbSession.average_quality ?? 0,
  sets: (dbSession.sets as WorkoutSet[]) ?? [],
  workoutCardId: dbSession.workout_card_id ?? undefined,
  workoutCardName: dbSession.workout_card_name ?? undefined,
  completedSets: dbSession.completed_sets ?? undefined,
  targetSets: dbSession.target_sets ?? undefined,
});

// Tipo per creare una sessione
export type CreateSessionInput = {
  duration: number;
  totalPushups: number;
  averageQuality: number;
  sets: WorkoutSet[];
  workoutCardId?: string;
  workoutCardName?: string;
  completedSets?: number;
  targetSets?: number;
};

// Converte da tipo app a DB Insert
const toDbInsert = (
  session: CreateSessionInput,
  userId: string
): InsertTables<'workout_sessions'> => ({
  user_id: userId,
  duration: session.duration,
  total_pushups: session.totalPushups,
  average_quality: session.averageQuality,
  sets: session.sets as unknown as InsertTables<'workout_sessions'>['sets'],
  workout_card_id: session.workoutCardId ?? null,
  workout_card_name: session.workoutCardName ?? null,
  completed_sets: session.completedSets ?? null,
  target_sets: session.targetSets ?? null,
});

// Fetch sessioni dell'utente (con paginazione opzionale)
export const fetchWorkoutSessions = async (
  userId: string,
  options?: { limit?: number; offset?: number }
): Promise<WorkoutSession[]> => {
  let query = supabase
    .from('workout_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (options?.limit) {
    query = query.limit(options.limit);
  }
  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit ?? 20) - 1);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching workout sessions:', error);
    throw error;
  }

  return (data ?? []).map(toWorkoutSession);
};

// Fetch sessioni per periodo
export const fetchSessionsByPeriod = async (
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<WorkoutSession[]> => {
  const { data, error } = await supabase
    .from('workout_sessions')
    .select('*')
    .eq('user_id', userId)
    .gte('date', startDate.toISOString())
    .lte('date', endDate.toISOString())
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching sessions by period:', error);
    throw error;
  }

  return (data ?? []).map(toWorkoutSession);
};

// Crea nuova sessione (le stats vengono aggiornate automaticamente dal trigger)
export const createWorkoutSession = async (
  session: CreateSessionInput,
  userId: string
): Promise<WorkoutSession> => {
  const { data, error } = await supabase
    .from('workout_sessions')
    .insert(toDbInsert(session, userId))
    .select()
    .single();

  if (error) {
    console.error('Error creating workout session:', error);
    throw error;
  }

  return toWorkoutSession(data);
};

// Elimina sessione
export const deleteWorkoutSession = async (sessionId: string): Promise<void> => {
  const { error } = await supabase
    .from('workout_sessions')
    .delete()
    .eq('id', sessionId);

  if (error) {
    console.error('Error deleting workout session:', error);
    throw error;
  }
};

// Conta sessioni totali
export const countWorkoutSessions = async (userId: string): Promise<number> => {
  const { count, error } = await supabase
    .from('workout_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (error) {
    console.error('Error counting sessions:', error);
    throw error;
  }

  return count ?? 0;
};
