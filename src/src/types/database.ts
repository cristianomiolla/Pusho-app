// Tipi generati per Supabase Database
// Questi tipi verranno aggiornati quando creeremo le tabelle su Supabase
// Puoi rigenerarli con: npx supabase gen types typescript --project-id YOUR_PROJECT_ID

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          nickname: string;
          avatar_url: string | null;
          city: string | null;
          region: string | null;
          country: string | null;
          latitude: number | null;
          longitude: number | null;
          main_badge: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          nickname: string;
          avatar_url?: string | null;
          city?: string | null;
          region?: string | null;
          country?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          main_badge?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nickname?: string;
          avatar_url?: string | null;
          city?: string | null;
          region?: string | null;
          country?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          main_badge?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      workout_sessions: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          duration: number;
          total_pushups: number;
          average_quality: number | null;
          sets: Json;
          workout_card_id: string | null;
          workout_card_name: string | null;
          completed_sets: number | null;
          target_sets: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date?: string;
          duration: number;
          total_pushups: number;
          average_quality?: number | null;
          sets: Json;
          workout_card_id?: string | null;
          workout_card_name?: string | null;
          completed_sets?: number | null;
          target_sets?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          duration?: number;
          total_pushups?: number;
          average_quality?: number | null;
          sets?: Json;
          workout_card_id?: string | null;
          workout_card_name?: string | null;
          completed_sets?: number | null;
          target_sets?: number | null;
          created_at?: string;
        };
      };
      workout_cards: {
        Row: {
          id: string;
          user_id: string | null;
          name: string;
          sets: number;
          reps_per_set: number;
          rest_time: number;
          variant: string | null;
          is_favorite: boolean;
          is_preset: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          name: string;
          sets: number;
          reps_per_set: number;
          rest_time: number;
          variant?: string | null;
          is_favorite?: boolean;
          is_preset?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          name?: string;
          sets?: number;
          reps_per_set?: number;
          rest_time?: number;
          variant?: string | null;
          is_favorite?: boolean;
          is_preset?: boolean;
          created_at?: string;
        };
      };
      user_stats: {
        Row: {
          user_id: string;
          total_pushups: number;
          total_sessions: number;
          max_in_single_set: number;
          average_quality: number;
          total_time_under_tension: number;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          total_pushups?: number;
          total_sessions?: number;
          max_in_single_set?: number;
          average_quality?: number;
          total_time_under_tension?: number;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          total_pushups?: number;
          total_sessions?: number;
          max_in_single_set?: number;
          average_quality?: number;
          total_time_under_tension?: number;
          updated_at?: string;
        };
      };
      local_challenges: {
        Row: {
          id: string;
          title: string;
          emoji: string;
          city: string;
          region: string | null;
          country: string | null;
          target_pushups: number;
          current_pushups: number;
          start_date: string;
          end_date: string;
          participants_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          emoji: string;
          city: string;
          region?: string | null;
          country?: string | null;
          target_pushups: number;
          current_pushups?: number;
          start_date: string;
          end_date: string;
          participants_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          emoji?: string;
          city?: string;
          region?: string | null;
          country?: string | null;
          target_pushups?: number;
          current_pushups?: number;
          start_date?: string;
          end_date?: string;
          participants_count?: number;
          created_at?: string;
        };
      };
      challenge_participants: {
        Row: {
          id: string;
          challenge_id: string;
          user_id: string;
          contribution: number;
          joined_at: string;
        };
        Insert: {
          id?: string;
          challenge_id: string;
          user_id: string;
          contribution?: number;
          joined_at?: string;
        };
        Update: {
          id?: string;
          challenge_id?: string;
          user_id?: string;
          contribution?: number;
          joined_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      badge_type: 'fire' | 'brick' | 'trophy' | 'star' | 'lightning' | 'target';
    };
  };
};

// Helper types per accesso più semplice
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

// Type aliases per comodità
export type Profile = Tables<'profiles'>;
export type WorkoutSessionDB = Tables<'workout_sessions'>;
export type WorkoutCardDB = Tables<'workout_cards'>;
export type UserStats = Tables<'user_stats'>;
export type LocalChallengeDB = Tables<'local_challenges'>;
export type ChallengeParticipant = Tables<'challenge_participants'>;
