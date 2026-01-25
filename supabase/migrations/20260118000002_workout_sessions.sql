-- ============================================
-- PUSHO DATABASE SCHEMA
-- Migration: Workout Sessions
-- Storico allenamenti completati
-- ============================================

-- ============================================
-- TABELLA: workout_sessions
-- Storico allenamenti completati
-- ============================================
CREATE TABLE IF NOT EXISTS workout_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Dati sessione
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  duration INTEGER NOT NULL CHECK (duration >= 0), -- secondi totali
  total_pushups INTEGER NOT NULL CHECK (total_pushups >= 0),
  average_quality NUMERIC(5,2) CHECK (average_quality >= 0 AND average_quality <= 100),

  -- Serie (JSONB per flessibilità)
  -- Formato: [{"pushups": 15, "quality": 88, "duration": 120}, ...]
  sets JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Collegamento opzionale a scheda
  workout_card_id UUID REFERENCES workout_cards(id) ON DELETE SET NULL,
  workout_card_name TEXT, -- snapshot del nome (caso scheda eliminata)
  completed_sets INTEGER, -- serie completate (per sessioni con scheda)
  target_sets INTEGER, -- serie target dalla scheda

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indici per query frequenti
CREATE INDEX idx_workout_sessions_user_id ON workout_sessions(user_id);
CREATE INDEX idx_workout_sessions_date ON workout_sessions(user_id, date DESC);
CREATE INDEX idx_workout_sessions_card ON workout_sessions(workout_card_id) WHERE workout_card_id IS NOT NULL;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: utenti possono vedere solo le proprie sessioni
CREATE POLICY "Users can view own sessions"
  ON workout_sessions FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: utenti possono inserire le proprie sessioni
CREATE POLICY "Users can insert own sessions"
  ON workout_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: utenti possono eliminare le proprie sessioni
CREATE POLICY "Users can delete own sessions"
  ON workout_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Nota: UPDATE non permesso - le sessioni sono immutabili una volta create
