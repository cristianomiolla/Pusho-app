export interface WorkoutSession {
  id: string;
  date: Date;
  duration: number; // in secondi
  totalPushups: number;
  averageQuality: number; // 0-100
  sets: WorkoutSet[];
  // Campi opzionali per sessioni con scheda
  workoutCardId?: string;      // ID della scheda usata (se presente = sessione con scheda)
  workoutCardName?: string;    // Nome della scheda per visualizzazione
  completedSets?: number;      // Numero di serie completate (per sessioni con scheda)
  targetSets?: number;         // Numero di serie target dalla scheda
}

export interface WorkoutSet {
  pushups: number;
  quality: number;
  duration: number;
}

export interface WorkoutCard {
  id: string;
  name: string;
  sets: number;
  repsPerSet: number;
  restTime: number; // in secondi
  variant?: string;
  isFavorite: boolean;
  isPreset: boolean; // schede di sistema non modificabili
  createdAt: Date;
}

export interface WorkoutStats {
  totalPushups: number;
  maxInSingleSet: number;
  totalTimeUnderTension: number; // in secondi
  totalSessions: number;
  averageQuality: number;
}

export type FilterPeriod = 'all' | 'month' | 'custom';

// Stati dell'allenamento guidato con scheda
export type GuidedWorkoutState =
  | 'idle'              // Nessuna scheda attiva
  | 'confirming'        // Modal di conferma aperto
  | 'active'            // Serie in corso
  | 'rest'              // Pausa tra serie
  | 'completed';        // Allenamento completato

export interface GuidedWorkoutSession {
  card: WorkoutCard;
  currentSet: number;           // Serie corrente (1-indexed)
  currentSetPushups: number;    // Push-up della serie corrente
  totalPushups: number;         // Push-up totali della sessione
  startTime: number;            // Timestamp inizio sessione
  endTime?: number;             // Timestamp fine sessione
  restTimeRemaining: number;    // Tempo pausa rimanente in secondi
  state: GuidedWorkoutState;
}
