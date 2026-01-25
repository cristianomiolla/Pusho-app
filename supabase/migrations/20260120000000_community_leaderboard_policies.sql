-- ============================================
-- PUSHO DATABASE SCHEMA
-- Migration: Community Leaderboard Policies
-- Permette agli utenti di vedere i dati degli altri per la leaderboard
-- ============================================

-- ============================================
-- TABELLA: workout_sessions
-- Aggiunge policy per permettere lettura globale (leaderboard)
-- ============================================

-- Policy: tutti gli utenti autenticati possono vedere tutte le sessioni
-- Necessaria per calcolare la leaderboard globale
CREATE POLICY "Authenticated users can view all sessions for leaderboard"
  ON workout_sessions FOR SELECT
  TO authenticated
  USING (true);

-- Nota: la policy esistente "Users can view own sessions" viene sovrascritta
-- perché questa nuova policy è più permissiva (USING true)

-- ============================================
-- TABELLA: user_stats
-- Aggiunge policy per permettere lettura globale (leaderboard)
-- ============================================

-- Policy: tutti gli utenti autenticati possono vedere tutte le stats
-- Necessaria per calcolare la leaderboard globale
CREATE POLICY "Authenticated users can view all stats for leaderboard"
  ON user_stats FOR SELECT
  TO authenticated
  USING (true);

-- Nota: la policy esistente "Users can view own stats" viene sovrascritta
-- perché questa nuova policy è più permissiva (USING true)

-- ============================================
-- NOTE SULLA SICUREZZA
-- ============================================
-- Le policy INSERT/UPDATE/DELETE rimangono limitate all'utente proprietario
-- Questo significa che:
-- ✅ Tutti possono VEDERE i dati di tutti (per leaderboard)
-- ✅ Solo il proprietario può INSERIRE i propri dati
-- ✅ Solo il proprietario può MODIFICARE i propri dati
-- ✅ Solo il proprietario può ELIMINARE i propri dati
