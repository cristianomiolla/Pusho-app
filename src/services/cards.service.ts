import { supabase } from '../config/supabase';
import type { WorkoutCardDB, InsertTables, UpdateTables } from '../types/database';
import type { WorkoutCard } from '../types/workout';

// Converte da DB a tipo app
const toWorkoutCard = (dbCard: WorkoutCardDB): WorkoutCard => ({
  id: dbCard.id,
  name: dbCard.name,
  sets: dbCard.sets,
  repsPerSet: dbCard.reps_per_set,
  restTime: dbCard.rest_time,
  variant: dbCard.variant ?? undefined,
  isFavorite: dbCard.is_favorite,
  isPreset: dbCard.is_preset,
  createdAt: new Date(dbCard.created_at),
});

// Converte da tipo app a DB Insert
const toDbInsert = (
  card: Omit<WorkoutCard, 'id' | 'createdAt' | 'isPreset'>,
  userId: string
): InsertTables<'workout_cards'> => ({
  user_id: userId,
  name: card.name,
  sets: card.sets,
  reps_per_set: card.repsPerSet,
  rest_time: card.restTime,
  variant: card.variant ?? null,
  is_favorite: card.isFavorite,
  is_preset: false, // Le schede create dall'utente non sono mai preset
});

// Fetch tutte le schede dell'utente
export const fetchWorkoutCards = async (userId: string): Promise<WorkoutCard[]> => {
  const { data, error } = await supabase
    .from('workout_cards')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching workout cards:', error);
    throw error;
  }

  return (data ?? []).map(toWorkoutCard);
};

// Crea nuova scheda
export const createWorkoutCard = async (
  card: Omit<WorkoutCard, 'id' | 'createdAt' | 'isPreset'>,
  userId: string
): Promise<WorkoutCard> => {
  const { data, error } = await supabase
    .from('workout_cards')
    .insert(toDbInsert(card, userId))
    .select()
    .single();

  if (error) {
    console.error('Error creating workout card:', error);
    throw error;
  }

  return toWorkoutCard(data);
};

// Aggiorna scheda esistente (non preset)
export const updateWorkoutCard = async (
  cardId: string,
  updates: Partial<Omit<WorkoutCard, 'id' | 'createdAt' | 'isPreset'>>
): Promise<WorkoutCard> => {
  const dbUpdates: UpdateTables<'workout_cards'> = {};

  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.sets !== undefined) dbUpdates.sets = updates.sets;
  if (updates.repsPerSet !== undefined) dbUpdates.reps_per_set = updates.repsPerSet;
  if (updates.restTime !== undefined) dbUpdates.rest_time = updates.restTime;
  if (updates.variant !== undefined) dbUpdates.variant = updates.variant ?? null;
  if (updates.isFavorite !== undefined) dbUpdates.is_favorite = updates.isFavorite;

  const { data, error } = await supabase
    .from('workout_cards')
    .update(dbUpdates)
    .eq('id', cardId)
    .select()
    .single();

  if (error) {
    console.error('Error updating workout card:', error);
    throw error;
  }

  return toWorkoutCard(data);
};

// Toggle preferito
export const toggleCardFavorite = async (cardId: string, isFavorite: boolean): Promise<void> => {
  const { error } = await supabase
    .from('workout_cards')
    .update({ is_favorite: isFavorite })
    .eq('id', cardId);

  if (error) {
    console.error('Error toggling favorite:', error);
    throw error;
  }
};

// Elimina scheda
export const deleteWorkoutCard = async (cardId: string): Promise<void> => {
  const { error } = await supabase
    .from('workout_cards')
    .delete()
    .eq('id', cardId);

  if (error) {
    console.error('Error deleting workout card:', error);
    throw error;
  }
};
