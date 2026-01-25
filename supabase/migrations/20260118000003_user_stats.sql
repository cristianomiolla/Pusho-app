-- ============================================
-- PUSHO DATABASE SCHEMA
-- Migration: User Stats
-- Statistiche aggregate utente
-- ============================================

-- ============================================
-- TABELLA: user_stats
-- Statistiche aggregate pre-calcolate
-- ============================================
CREATE TABLE IF NOT EXISTS user_stats (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_pushups INTEGER NOT NULL DEFAULT 0,
  max_in_single_set INTEGER NOT NULL DEFAULT 0,
  total_time_under_tension INTEGER NOT NULL DEFAULT 0, -- secondi
  total_sessions INTEGER NOT NULL DEFAULT 0,
  average_quality NUMERIC(5,2) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- Policy: utenti possono vedere solo le proprie stats
CREATE POLICY "Users can view own stats"
  ON user_stats FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: utenti possono inserire le proprie stats
CREATE POLICY "Users can insert own stats"
  ON user_stats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: utenti possono aggiornare le proprie stats
CREATE POLICY "Users can update own stats"
  ON user_stats FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- TRIGGER: Auto-update updated_at
-- ============================================
CREATE TRIGGER update_user_stats_updated_at
  BEFORE UPDATE ON user_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNCTION: Aggiorna stats dopo nuova sessione
-- ============================================
CREATE OR REPLACE FUNCTION update_user_stats_on_session()
RETURNS TRIGGER AS $$
DECLARE
  max_set_pushups INTEGER;
BEGIN
  -- Trova il massimo pushups in una singola serie dalla sessione
  -- Solo se è un allenamento con scheda (workout_card_id non null)
  IF NEW.workout_card_id IS NOT NULL THEN
    SELECT COALESCE(MAX((s->>'pushups')::INTEGER), 0)
    INTO max_set_pushups
    FROM jsonb_array_elements(NEW.sets) AS s;
  ELSE
    max_set_pushups := 0;
  END IF;

  -- Inserisci o aggiorna le statistiche
  INSERT INTO user_stats (
    user_id,
    total_pushups,
    max_in_single_set,
    total_time_under_tension,
    total_sessions,
    average_quality
  )
  VALUES (
    NEW.user_id,
    NEW.total_pushups,
    max_set_pushups,
    NEW.duration,
    1,
    COALESCE(NEW.average_quality, 0)
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_pushups = user_stats.total_pushups + NEW.total_pushups,
    max_in_single_set = GREATEST(user_stats.max_in_single_set, max_set_pushups),
    total_time_under_tension = user_stats.total_time_under_tension + NEW.duration,
    total_sessions = user_stats.total_sessions + 1,
    average_quality = (
      (user_stats.average_quality * user_stats.total_sessions + COALESCE(NEW.average_quality, 0))
      / (user_stats.total_sessions + 1)
    ),
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger che aggiorna le stats quando viene inserita una sessione
CREATE TRIGGER on_workout_session_created
  AFTER INSERT ON workout_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_stats_on_session();

-- ============================================
-- FUNCTION: Crea stats vuote per nuovo utente
-- ============================================
CREATE OR REPLACE FUNCTION create_user_stats_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_stats (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger che crea le stats quando un utente si registra
CREATE TRIGGER on_auth_user_created_stats
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_stats_on_signup();
