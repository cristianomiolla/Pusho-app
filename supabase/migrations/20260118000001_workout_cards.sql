-- ============================================
-- PUSHO DATABASE SCHEMA
-- Migration: Workout Cards
-- Schede allenamento personalizzate
-- ============================================

-- ============================================
-- TABELLA: workout_cards
-- Schede allenamento (preset + custom)
-- ============================================
CREATE TABLE IF NOT EXISTS workout_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sets INTEGER NOT NULL CHECK (sets > 0),
  reps_per_set INTEGER NOT NULL CHECK (reps_per_set > 0),
  rest_time INTEGER NOT NULL DEFAULT 60 CHECK (rest_time >= 0), -- secondi
  variant TEXT, -- descrizione/variante opzionale
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  is_preset BOOLEAN NOT NULL DEFAULT false, -- schede di sistema
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indice per query frequenti
CREATE INDEX idx_workout_cards_user_id ON workout_cards(user_id);
CREATE INDEX idx_workout_cards_favorite ON workout_cards(user_id, is_favorite) WHERE is_favorite = true;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE workout_cards ENABLE ROW LEVEL SECURITY;

-- Policy: utenti possono vedere solo le proprie schede
CREATE POLICY "Users can view own cards"
  ON workout_cards FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: utenti possono inserire le proprie schede
CREATE POLICY "Users can insert own cards"
  ON workout_cards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: utenti possono aggiornare le proprie schede (non preset)
CREATE POLICY "Users can update own cards"
  ON workout_cards FOR UPDATE
  USING (auth.uid() = user_id AND is_preset = false);

-- Policy: utenti possono eliminare le proprie schede (non preset)
CREATE POLICY "Users can delete own cards"
  ON workout_cards FOR DELETE
  USING (auth.uid() = user_id AND is_preset = false);

-- ============================================
-- TRIGGER: Auto-update updated_at
-- ============================================
CREATE TRIGGER update_workout_cards_updated_at
  BEFORE UPDATE ON workout_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
